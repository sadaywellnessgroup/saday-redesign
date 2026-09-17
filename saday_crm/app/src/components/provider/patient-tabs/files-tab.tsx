import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SendSheet, type MaterialRow } from '@/components/provider/send-sheet';
import { repos } from '@/lib/repos';
import type { Patient } from '@/lib/domain';
import { formatISTDateTime } from '@/lib/utils';

const KIND_LABEL: Record<string, string> = {
  report: 'Report',
  prescription: 'Prescription',
  brochure: 'Brochure',
  worksheet: 'Worksheet',
  other: 'Other',
};

function sizeLabel(bytes: number): string {
  if (bytes === 0) return 'Link';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Files tab — everything shared in both directions, plus the Send sheet
 * (library / upload / URL). Each dispatch records who sent it and when. */
export async function FilesTab({ patient }: { patient: Patient }) {
  const [files, materials, dispatches, providerUsers] = await Promise.all([
    repos.file.listForPatient(patient.id),
    repos.materials.listActive(patient.organizationId),
    repos.materials.listDispatchesForPatient(patient.id),
    repos.user.listByRole(patient.organizationId, 'provider'),
  ]);

  const materialRows: MaterialRow[] = materials.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description ?? '',
    kind: m.kind,
    category: m.category,
  }));

  const userName = (userId: string) =>
    providerUsers.some((u) => u.id === userId) ? 'You' : patient.displayName;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="sec-title">Files &amp; materials</h2>
        <SendSheet patientId={patient.id} materials={materialRows} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">Shared files</h3>
          {files.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing shared yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <div key={file.id} className="flex flex-wrap items-center gap-2 rounded-soft bg-cream px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-indigo-deep">
                      {file.originalName ?? file.storagePath}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {file.uploadedByRole === 'provider' ? 'Sent by you' : `From ${patient.displayName}`} ·{' '}
                      {formatISTDateTime(file.createdAt)} · {sizeLabel(file.bytes)}
                    </p>
                  </div>
                  <Badge variant="secondary">{KIND_LABEL[file.kind] ?? file.kind}</Badge>
                  {file.externalUrl ? (
                    <a
                      href={file.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] font-semibold text-indigo"
                    >
                      Open link
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">Materials sent</h3>
          {dispatches.length === 0 ? (
            <p className="text-sm text-ink-soft">No materials sent yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {dispatches.map((dispatch) => {
                const material = materials.find((m) => m.id === dispatch.materialId);
                return (
                  <div key={dispatch.id} className="flex flex-wrap items-center gap-2 rounded-soft bg-cream px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-indigo-deep">{material?.title ?? '—'}</p>
                      <p className="text-xs text-ink-soft">
                        {userName(dispatch.sentByUserId)} · {formatISTDateTime(dispatch.sentAt)}
                      </p>
                    </div>
                    <Badge variant={dispatch.openedAt ? 'default' : 'secondary'}>
                      {dispatch.openedAt ? 'Opened' : 'Not opened'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
