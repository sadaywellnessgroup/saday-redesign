import { getTranslations } from 'next-intl/server';
import { PageHeading } from '@/components/page-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUploadSheet } from '@/components/patient/file-upload-sheet';
import { getSession } from '@/lib/auth/session';
import { repos, ORG_ID } from '@/lib/repos';
import { formatISTDate } from '@/lib/utils';

function fileSizeLabel(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Route 12 — files grouped by source (ui-references §B "Files/materials":
 * Amaha knowledge-centre grouping). Upload via the Sheet, StubFileStorage
 * enforced (25 MB + MIME, D-007). */
export default async function FilesPage() {
  const t = await getTranslations('appFiles');
  const session = await getSession();
  const patientId = session?.patientId;

  const [files, dispatches, library] = await Promise.all([
    patientId ? repos.file.listForPatient(patientId) : Promise.resolve([]),
    patientId ? repos.materials.listDispatchesForPatient(patientId) : Promise.resolve([]),
    repos.materials.listActive(ORG_ID),
  ]);

  const fromProvider = files.filter((f) => f.uploadedByRole === 'provider');
  const uploadedByYou = files.filter((f) => f.uploadedByRole === 'patient');
  const libraryById = new Map(library.map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-5">
      <PageHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} motif="kamal-jali" />

      <div className="flex justify-end">
        <FileUploadSheet />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="sec-title">{t('fromProvider')}</h2>
          {fromProvider.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('noProviderFiles')}</p>
          ) : (
            fromProvider.map((f) => <FileRow key={f.id} name={f.originalName ?? f.storagePath} meta={`${formatISTDate(f.createdAt)} · ${fileSizeLabel(f.bytes)}`} kind={f.kind} downloadLabel={t('download')} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="sec-title">{t('materials')}</h2>
          {dispatches.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('noMaterials')}</p>
          ) : (
            dispatches.map((d) => {
              const item = libraryById.get(d.materialId);
              return <FileRow key={d.id} name={item?.title ?? d.materialId} meta={formatISTDate(d.sentAt)} kind={item?.kind ?? 'other'} downloadLabel={t('download')} />;
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="sec-title">{t('uploadedByYou')}</h2>
          {uploadedByYou.length === 0 ? (
            <p className="text-sm text-ink-soft">{t('noOwnFiles')}</p>
          ) : (
            uploadedByYou.map((f) => <FileRow key={f.id} name={f.originalName ?? f.storagePath} meta={`${formatISTDate(f.createdAt)} · ${fileSizeLabel(f.bytes)}`} kind={f.kind} downloadLabel={t('download')} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FileRow({ name, meta, kind, downloadLabel }: { name: string; meta: string; kind: string; downloadLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-soft bg-cream px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{name}</p>
        <p className="text-xs text-ink-soft">{meta}</p>
      </div>
      <div className="flex flex-none items-center gap-2">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {kind}
        </Badge>
        <span className="text-xs font-semibold text-indigo">{downloadLabel}</span>
      </div>
    </div>
  );
}
