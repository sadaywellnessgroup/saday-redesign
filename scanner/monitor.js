/**
 * Claude Usage Monitor
 *
 * Runs alongside scanner.js. Every 5 minutes it checks your Claude Pro session
 * usage and pauses the scanner when tokens are running low (5-10% remaining),
 * then automatically resumes after the session reset.
 *
 * Usage:
 *   node monitor.js                    # auto mode — reads usage.json every 5 min
 *   node monitor.js --report           # print current status and exit
 *
 * How it works with scanner.js:
 *   - monitor.js writes .PAUSE when usage is low
 *   - monitor.js writes .RESUME_AT with the reset timestamp
 *   - scanner.js polls for .PAUSE between every screen and sleeps until .RESUME_AT
 *   - monitor.js removes .PAUSE when the reset time passes
 *
 * Feeding usage data (pick one method):
 *
 *   METHOD A — Manual update (simplest):
 *     Run `/usage` in Claude Code, then paste the output into update-usage.sh:
 *       echo '{"percentRemaining": 8, "resetInMinutes": 180}' > .usage.json
 *
 *   METHOD B — Auto-poll via claude CLI (if available):
 *     The monitor tries `claude /usage` every 5 minutes automatically.
 *     If that command works in your setup, nothing else is needed.
 *
 *   METHOD C — Time-based estimation (fallback):
 *     If no usage data is available, the monitor estimates based on elapsed
 *     wall-clock time against a 5-hour Pro session window.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const USAGE_FILE      = path.join(__dirname, '.usage.json');
const PAUSE_FILE      = path.join(__dirname, '.PAUSE');
const RESUME_FILE     = path.join(__dirname, '.RESUME_AT');
const SESSION_START   = path.join(__dirname, '.session_start');

// Pro plan limits
const SESSION_DURATION_MINUTES = 300; // 5 hours
const CHECK_INTERVAL_MS        = 5 * 60 * 1000; // 5 minutes
const PAUSE_THRESHOLD_PERCENT  = 10;  // pause at ≤10% remaining
const WARN_THRESHOLD_PERCENT   = 15;  // warn at ≤15% remaining

// ─── Session start time tracking ─────────────────────────────────────────────

function getSessionStart() {
  if (fs.existsSync(SESSION_START)) {
    const ts = fs.readFileSync(SESSION_START, 'utf8').trim();
    const d = new Date(ts);
    if (!isNaN(d)) return d;
  }
  // First run — record now as session start
  const now = new Date();
  fs.writeFileSync(SESSION_START, now.toISOString());
  return now;
}

function resetSessionStart() {
  const now = new Date();
  fs.writeFileSync(SESSION_START, now.toISOString());
  return now;
}

// ─── Usage data sources ───────────────────────────────────────────────────────

/**
 * Try to get usage from the claude CLI.
 * Returns { percentRemaining, resetInMinutes } or null.
 */
function tryClaudeCLI() {
  try {
    // Attempt to call claude CLI — works if claude is in PATH and supports /usage
    const output = execSync('claude --print /usage 2>/dev/null', { timeout: 10000, encoding: 'utf8' });
    return parseClaudeOutput(output);
  } catch {
    return null;
  }
}

/**
 * Parse common /usage output formats.
 * Handles: "X% of tokens remaining, resets in Yh Zm" and similar.
 */
function parseClaudeOutput(text) {
  if (!text) return null;

  // Match "X% remaining" or "X% of tokens remaining"
  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of tokens\s+)?remaining/i);

  // Match "resets in Xh Ym" or "resets in X hours Y minutes" or "resets in Xm"
  const resetMatch = text.match(/resets?\s+in\s+(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?/i)
    || text.match(/(\d+):(\d+)\s*(?:remaining|until reset)/i);

  let percentRemaining = null;
  let resetInMinutes   = null;

  if (pctMatch) {
    percentRemaining = parseFloat(pctMatch[1]);
  }

  if (resetMatch) {
    const hours   = parseInt(resetMatch[1] || '0', 10);
    const minutes = parseInt(resetMatch[2] || '0', 10);
    resetInMinutes = hours * 60 + minutes;
  }

  if (percentRemaining === null && resetInMinutes === null) return null;
  return { percentRemaining, resetInMinutes, source: 'claude-cli' };
}

/**
 * Read usage from .usage.json if the user wrote it manually.
 * Format: { "percentRemaining": 8, "resetInMinutes": 180 }
 */
function readUsageFile() {
  if (!fs.existsSync(USAGE_FILE)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    const age  = Date.now() - new Date(data.writtenAt || 0).getTime();
    // Ignore stale data older than 6 minutes (one check cycle)
    if (age > 6 * 60 * 1000 && data.writtenAt) {
      return null;
    }
    return { percentRemaining: data.percentRemaining, resetInMinutes: data.resetInMinutes, source: 'usage-file' };
  } catch {
    return null;
  }
}

/**
 * Estimate usage from elapsed wall-clock time since session start.
 * This is a rough proxy — assumes linear token consumption over 5 hours.
 */
function estimateFromElapsedTime() {
  const start     = getSessionStart();
  const elapsedMs = Date.now() - start.getTime();
  const elapsedMin = elapsedMs / 60_000;
  const totalMin   = SESSION_DURATION_MINUTES;

  const percentUsed      = Math.min(100, (elapsedMin / totalMin) * 100);
  const percentRemaining = Math.max(0, 100 - percentUsed);
  const resetInMinutes   = Math.max(0, totalMin - elapsedMin);

  return { percentRemaining, resetInMinutes, source: 'time-estimate', elapsedMin: Math.round(elapsedMin) };
}

// ─── Pause / resume logic ─────────────────────────────────────────────────────

function setPaused(resumeAt) {
  fs.writeFileSync(PAUSE_FILE, new Date().toISOString());
  fs.writeFileSync(RESUME_FILE, JSON.stringify({ resumeAt: resumeAt.toISOString() }, null, 2));
  console.log(`\n⏸️  PAUSED scanner — resume at ${resumeAt.toLocaleTimeString()}`);
  console.log(`   .PAUSE and .RESUME_AT written.`);
}

function setResumed() {
  if (fs.existsSync(PAUSE_FILE))   fs.unlinkSync(PAUSE_FILE);
  if (fs.existsSync(RESUME_FILE))  fs.unlinkSync(RESUME_FILE);
  console.log('▶️  Removed PAUSE — scanner will resume.');
}

function isPaused() {
  return fs.existsSync(PAUSE_FILE);
}

// ─── Main check loop ──────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] [monitor] ${msg}`);
}

async function runCheck() {
  // Try data sources in priority order
  const usage = tryClaudeCLI() || readUsageFile() || estimateFromElapsedTime();

  const pct   = usage.percentRemaining != null ? usage.percentRemaining.toFixed(1) : '?';
  const mins  = usage.resetInMinutes   != null ? Math.round(usage.resetInMinutes) : '?';
  log(`Usage: ${pct}% remaining | resets in ~${mins} min | source: ${usage.source}`);

  if (isPaused()) {
    // Check if it's time to resume
    if (fs.existsSync(RESUME_FILE)) {
      const data = JSON.parse(fs.readFileSync(RESUME_FILE, 'utf8'));
      const resumeAt = new Date(data.resumeAt);
      if (new Date() >= resumeAt) {
        log('Reset time reached — resuming scanner.');
        resetSessionStart(); // new session started
        setResumed();
      } else {
        log(`Still paused — resume at ${resumeAt.toLocaleTimeString()}`);
      }
    }
    return;
  }

  // Decide whether to pause
  if (usage.percentRemaining != null && usage.percentRemaining <= PAUSE_THRESHOLD_PERCENT) {
    const resetInMs = (usage.resetInMinutes || 0) * 60_000;
    const resumeAt  = new Date(Date.now() + resetInMs + 60_000); // +1 min buffer
    log(`⚠️  Only ${pct}% remaining — pausing scanner until ${resumeAt.toLocaleTimeString()}`);
    setPaused(resumeAt);

  } else if (usage.percentRemaining != null && usage.percentRemaining <= WARN_THRESHOLD_PERCENT) {
    log(`⚠️  Warning: ${pct}% remaining — approaching pause threshold`);

  } else {
    log(`✅ Usage OK (${pct}% remaining)`);
  }
}

// ─── Report mode ──────────────────────────────────────────────────────────────

function runReport() {
  const usage = tryClaudeCLI() || readUsageFile() || estimateFromElapsedTime();
  const paused = isPaused();

  console.log('\n=== Claude Usage Monitor Status ===\n');
  console.log(`  Source:            ${usage.source}`);
  console.log(`  % remaining:       ${usage.percentRemaining?.toFixed(1) ?? '?'}%`);
  console.log(`  Resets in:         ~${usage.resetInMinutes != null ? Math.round(usage.resetInMinutes) : '?'} minutes`);
  console.log(`  Scanner paused:    ${paused ? 'YES' : 'no'}`);

  if (paused && fs.existsSync(RESUME_FILE)) {
    const data = JSON.parse(fs.readFileSync(RESUME_FILE, 'utf8'));
    console.log(`  Resume at:         ${new Date(data.resumeAt).toLocaleTimeString()}`);
  }

  if (usage.source === 'time-estimate') {
    console.log(`\n  ℹ️  Using time-based estimate. For accurate data, paste /usage output:`);
    console.log(`     echo '{"percentRemaining": <N>, "resetInMinutes": <M>, "writtenAt": "${new Date().toISOString()}"}' > .usage.json`);
  }
  console.log('');
}

// ─── Update helper (called by update-usage.sh) ────────────────────────────────

/**
 * Convenience: write usage data directly from command line.
 *   node monitor.js --update 8 180
 *   (percentRemaining=8, resetInMinutes=180)
 */
function runUpdate(pct, mins) {
  const data = {
    percentRemaining: parseFloat(pct),
    resetInMinutes:   parseInt(mins, 10),
    writtenAt:        new Date().toISOString(),
  };
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
  console.log(`Updated .usage.json: ${pct}% remaining, resets in ${mins} min`);
  // Immediately run a check so pause kicks in right away if needed
  runCheck();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--report')) {
  runReport();

} else if (args.includes('--update')) {
  const pct  = args[args.indexOf('--update') + 1];
  const mins = args[args.indexOf('--update') + 2];
  if (!pct || !mins) {
    console.log('Usage: node monitor.js --update <percentRemaining> <resetInMinutes>');
    console.log('Example: node monitor.js --update 8 180');
  } else {
    await runUpdate(pct, mins);
  }

} else if (args.includes('--unpause')) {
  setResumed();
  resetSessionStart();
  console.log('Manually removed PAUSE — scanner will resume on next screen check.');

} else {
  // Normal mode — run every 5 minutes indefinitely
  log('Starting monitor. Checking every 5 minutes.');
  log(`Pause threshold: ≤${PAUSE_THRESHOLD_PERCENT}% remaining`);
  log('');

  await runCheck(); // immediate first check
  setInterval(runCheck, CHECK_INTERVAL_MS);

  // Keep process alive
  process.on('SIGINT', () => {
    log('Monitor stopped.');
    process.exit(0);
  });
}
