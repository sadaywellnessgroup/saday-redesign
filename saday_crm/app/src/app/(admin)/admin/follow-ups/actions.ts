'use server';

import { revalidatePath } from 'next/cache';
import { repos, ORG_ID } from '@/lib/repos';
import { requireAdmin } from '@/lib/admin/console-data';
import { validateFollowUpHours } from '@/lib/admin/validation';
import { adapters } from '@/lib/adapters';
import type { FollowUpFlowKind, FollowUpQuestion } from '@/lib/domain';

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface FlowFormInput {
  offsetHours: number;
  isActive: boolean;
  messageBodyEn: string;
  messageBodyHi: string;
  questions: FollowUpQuestion[];
}

/** D-023: flows are configured org-wide, not per provider. Timing is
 * validated the same way for both check-in and feedback. */
export async function saveFlowAction(kind: FollowUpFlowKind, input: FlowFormInput): Promise<ActionResult> {
  await requireAdmin();
  const error = validateFollowUpHours(input.offsetHours);
  if (error) return { ok: false, error };
  if (!input.messageBodyEn.trim()) return { ok: false, error: 'Message body (English) is required.' };

  await repos.followUp.updateFlow(ORG_ID, kind, {
    offsetHours: input.offsetHours,
    isActive: input.isActive,
    messageBodyEn: input.messageBodyEn,
    messageBodyHi: input.messageBodyHi,
    questions: input.questions,
  });

  revalidatePath('/admin/follow-ups');
  revalidatePath('/admin/settings');
  return { ok: true };
}

/** "Send test" — writes a real (stub) WhatsApp send to `.dev-outbox` via
 * StubWhatsAppSender, so admin can see the exact payload a real send would
 * produce, with a fixed FIXTURE number (nothing leaves the machine). */
export async function sendTestAction(kind: FollowUpFlowKind): Promise<ActionResult> {
  await requireAdmin();
  const flow = await repos.followUp.getFlow(ORG_ID, kind);
  if (!flow) return { ok: false, error: 'Flow not found.' };

  await adapters.whatsapp.sendTemplate({
    toPhoneE164: '+919999999999', // FIXTURE — admin test send, no real recipient
    templateCode: kind === 'check_in' ? 'session_checkin' : 'session_feedback',
    language: 'en',
    variables: { patient_first_name: 'Test', provider_name: 'Test provider' },
  });

  return { ok: true };
}
