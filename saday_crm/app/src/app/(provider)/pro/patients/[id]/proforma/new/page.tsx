import { notFound, redirect } from 'next/navigation';
import { repos } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';
import { startProformaAction } from '@/app/(provider)/pro/patients/[id]/proforma/actions';

/** Route /pro/patients/[id]/proforma/new — opens or resumes the live
 * proforma and hands over to the editor. */
export default async function NewProformaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProvider();

  const patient = await repos.patient.getById(id);
  if (!patient) notFound();

  const result = await startProformaAction(id);
  if (!result.ok) notFound();
  redirect(`/pro/patients/${id}/proforma/${result.proformaId}`);
}
