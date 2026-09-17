'use server';

import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/repos';
import { getSession } from '@/lib/auth/session';

export async function submitAssessmentAction(toolId: string, answers: Record<string, number>) {
  const session = await getSession();
  if (!session?.patientId) return { ok: false as const };
  const submission = await repos.psychometrics.createSubmission({
    organizationId: session.organizationId,
    patientId: session.patientId,
    toolId,
    answers,
    administeredBy: 'self',
  });
  revalidatePath('/app/track');
  revalidatePath('/app');
  return { ok: true as const, submission };
}
