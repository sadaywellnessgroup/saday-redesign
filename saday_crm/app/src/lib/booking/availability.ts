import type { AvailableSlot, ProviderProfile } from '@/lib/domain';
import { repos, ORG_ID } from '@/lib/repos';
import { bookableTypesForPatient, pickEarliestCandidate, type EarliestCandidate } from './logic';

const SEARCH_WINDOW_DAYS = 14;

function windowFrom(now: Date) {
  const fromISO = now.toISOString();
  const toISO = new Date(now.getTime() + SEARCH_WINDOW_DAYS * 86_400_000).toISOString();
  return { fromISO, toISO };
}

/** Earliest bookable slot for one provider across all of their active
 * session types, within the next 14 days (ui-references §E-1: a provider
 * with none in that window is not listed). */
export async function earliestSlotForProvider(
  provider: ProviderProfile,
  now: Date = new Date(),
  /** D-034: a patient with no prior appointment is only offered the
   * provider's first-consultation type. */
  hasPriorAppointments = true,
): Promise<{ sessionTypeId: string; slot: AvailableSlot } | null> {
  const { fromISO, toISO } = windowFrom(now);
  const candidateTypes = bookableTypesForPatient(provider.sessionTypes, hasPriorAppointments);
  const results = await Promise.all(
    candidateTypes.map(async (st) => {
      const slots = await repos.booking.searchSlots({ providerId: provider.id, sessionTypeId: st.id, fromISO, toISO, now });
      return slots[0] ? { sessionTypeId: st.id, slot: slots[0] } : null;
    }),
  );
  const found = results.filter((r): r is { sessionTypeId: string; slot: AvailableSlot } => r !== null);
  if (found.length === 0) return null;
  return found.reduce((best, cur) => (cur.slot.slotStart < best.slot.slotStart ? cur : best));
}

export interface BookableProvider {
  provider: ProviderProfile;
  earliest: { sessionTypeId: string; slot: AvailableSlot };
}

/** Every org-bookable provider that has >=1 slot in the next 14 days, each
 * paired with their earliest slot (ui-references §E-1: zero-slot providers
 * are dropped, not shown disabled). */
export async function listBookableProvidersWithEarliest(
  now: Date = new Date(),
  hasPriorAppointments = true,
): Promise<BookableProvider[]> {
  const providers = await repos.provider.listBookable(ORG_ID);
  const withEarliest = await Promise.all(
    providers.map(async (provider) => {
      const earliest = await earliestSlotForProvider(provider, now, hasPriorAppointments);
      return earliest ? { provider, earliest } : null;
    }),
  );
  return withEarliest.filter((p): p is BookableProvider => p !== null);
}

/** Cross-provider "earliest available" (route 6, D-004 + D-034): the
 * single soonest slot across every bookable provider, restricted to
 * first-consultation types when the patient has never been seen. */
export async function earliestAcrossAllProviders(
  now: Date = new Date(),
  /** false for a patient with no prior appointment — D-034 pins the
   * auto-assign to a first consultation. */
  hasPriorAppointments = true,
): Promise<{ provider: ProviderProfile; sessionTypeId: string; slot: AvailableSlot } | null> {
  const bookable = await listBookableProvidersWithEarliest(now, hasPriorAppointments);
  const candidates: (EarliestCandidate & { provider: ProviderProfile })[] = bookable.map((b) => ({
    providerId: b.provider.id,
    sessionTypeId: b.earliest.sessionTypeId,
    slot: b.earliest.slot,
    provider: b.provider,
  }));
  const winner = pickEarliestCandidate(candidates);
  if (!winner) return null;
  return { provider: winner.provider, sessionTypeId: winner.sessionTypeId, slot: winner.slot };
}
