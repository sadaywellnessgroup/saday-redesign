/* Minimal ICS (RFC 5545) builder for the "add to calendar" link on the
 * confirmation screen (route 7). No external calendar library — a booking
 * confirmation only ever needs a single VEVENT. */

function toICSDate(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function foldLine(line: string): string {
  // RFC 5545 §3.1: lines >75 octets should be folded; our lines are short
  // enough in practice, kept simple rather than byte-exact.
  return line;
}

export function buildAppointmentICS(a: {
  uid: string;
  title: string;
  description: string;
  startISO: string;
  endISO: string;
}): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saday Wellness//CRM//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${a.uid}@sadaywellness.com`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(a.startISO)}`,
    `DTEND:${toICSDate(a.endISO)}`,
    `SUMMARY:${a.title}`,
    `DESCRIPTION:${a.description.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n');
}
