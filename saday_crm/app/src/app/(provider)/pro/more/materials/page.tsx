import { getTranslations } from 'next-intl/server';
import { ConsoleHeading } from '@/components/provider/console-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { repos, ORG_ID } from '@/lib/repos';
import { requireProvider } from '@/lib/provider/console-data';

/** Route /pro/more/materials — browse-only catalogue (D-006: generic
 * Saday-branded materials, not per-doctor). Sending happens from a
 * patient's Files tab, where it can be recorded against that patient. */
export default async function MaterialsLibraryPage() {
  const t = await getTranslations('pro.materials');
  await requireProvider();
  const materials = await repos.materials.listActive(ORG_ID);

  const byCategory = materials.reduce<Record<string, typeof materials>>((acc, material) => {
    (acc[material.category] ??= []).push(material);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <ConsoleHeading kicker={t('kicker')} title={t('title')} sub={t('sub')} />

      {Object.entries(byCategory).map(([category, items]) => (
        <Card key={category}>
          <CardContent className="flex flex-col gap-3 pt-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
              {category.replace(/_/g, ' ')}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map((material) => (
                <div key={material.id} className="flex flex-wrap items-center gap-2 rounded-soft bg-cream px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold text-indigo-deep">{material.title}</p>
                    <p className="text-xs text-ink-soft">{material.description}</p>
                  </div>
                  <Badge variant="secondary">{material.kind}</Badge>
                  <Badge variant="outline">{material.language.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
