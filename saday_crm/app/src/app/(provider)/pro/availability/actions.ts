'use server';

import { revalidatePath } from 'next/cache';
import { requireProvider } from '@/lib/provider/console-data';
import { repos } from '@/lib/repos';
import {
  validateAvailabilityRules,
  validateSessionSettings,
  type DraftRule,
  type RuleValidationError,
  type SessionSettings,
} from '@/lib/provider/availability-rules';

export type SaveAvailabilityResult =
  | { ok: true }
  | { ok: false; ruleErrors: RuleValidationError[]; settingErrors: string[] };

/** Saves the weekly grid and the session settings as one unit — the same
 * shape the P2 SQL version uses (delete + insert in one transaction). */
export async function saveAvailabilityAction(
  rules: DraftRule[],
  settings: SessionSettings,
): Promise<SaveAvailabilityResult> {
  const { providerId } = await requireProvider();

  const ruleErrors = validateAvailabilityRules(rules);
  const settingErrors = validateSessionSettings(settings);
  if (ruleErrors.length > 0 || settingErrors.length > 0) {
    return { ok: false, ruleErrors, settingErrors };
  }

  await repos.provider.replaceAvailabilityRules(
    providerId,
    rules.map((r) => ({ weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })),
  );
  await repos.provider.updateSessionSettings(providerId, settings);

  revalidatePath('/pro/availability');
  revalidatePath('/pro/calendar');
  revalidatePath('/pro');
  return { ok: true };
}

export async function addDayOffAction(input: {
  date: string;
  reason: string;
  repeatsYearly: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const { providerId } = await requireProvider();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: 'bad_date' };
  await repos.provider.addDayOff(providerId, {
    date: input.date,
    reason: input.reason.trim() || null,
    repeatsYearly: input.repeatsYearly,
  });
  revalidatePath('/pro/availability');
  revalidatePath('/pro/calendar');
  return { ok: true };
}

export async function removeDayOffAction(blockoutId: string): Promise<{ ok: boolean }> {
  const { providerId } = await requireProvider();
  await repos.provider.removeDayOff(providerId, blockoutId);
  revalidatePath('/pro/availability');
  revalidatePath('/pro/calendar');
  return { ok: true };
}
