import { randomUUID } from 'node:crypto';
import type {
  Provider,
  ProviderAvailabilityRule,
  ProviderBlockout,
  ProviderProfile,
  ProviderSessionType,
  UUID,
} from '@/lib/domain';
import { ORG_ID } from './fixtures';
import { providerAvailabilityRules, providerBlockouts, providerSessionTypes, providers } from './fixtures';

export interface AvailabilityRuleInput {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface SessionSettingsInput {
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
}

export interface DayOffInput {
  date: string; // "YYYY-MM-DD" (IST calendar day)
  reason: string | null;
  repeatsYearly: boolean;
}

export interface ProviderProfilePatch {
  professionalTitle?: Provider['professionalTitle'];
  qualifications?: string[];
  specialisations?: string[];
  languagesSpoken?: string[];
  registrationNumber?: string | null;
  bioShort?: string | null;
  bioLong?: string | null;
  isAcceptingPatients?: boolean;
  /** Admin-only fields (D-018/D-020) — the provider console never sends
   * these, only /admin/providers/[id]. */
  commissionPct?: number;
  isActive?: boolean;
}

export interface SessionTypePatch {
  nameEn?: string;
  nameHi?: string | null;
  pricePaise?: number;
  isActive?: boolean;
}

export interface ProviderRepo {
  getById(id: UUID): Promise<Provider | null>;
  getBySlug(organizationId: UUID, slug: string): Promise<Provider | null>;
  listBookable(organizationId: UUID): Promise<ProviderProfile[]>;
  /** Admin /admin/providers — every provider in the org, active or not
   * (unlike `listBookable`, which is the patient-facing "can be booked
   * right now" filter). */
  listAll(organizationId: UUID): Promise<ProviderProfile[]>;
  /** Admin /admin/providers/[id] — edits price/name for one session type;
   * this is the one place D-020 says prices are actually set (the
   * provider console shows them read-only, README "What was not built"). */
  updateSessionType(providerId: UUID, sessionTypeId: UUID, patch: SessionTypePatch): Promise<ProviderSessionType>;
  getProfile(id: UUID): Promise<ProviderProfile | null>;
  listSessionTypes(providerId: UUID): Promise<ProviderSessionType[]>;
  /** Admin variant of `listSessionTypes` — includes inactive types too, so
   * an admin can see (and re-enable) one they turned off. */
  listAllSessionTypes(providerId: UUID): Promise<ProviderSessionType[]>;
  listAvailabilityRules(providerId: UUID): Promise<ProviderAvailabilityRule[]>;
  listBlockouts(providerId: UUID): Promise<ProviderBlockout[]>;
  /** Screens-phase addition (route /pro/availability): replaces the whole
   * weekly grid for a provider in one go — the editor submits the grid as
   * a unit, which is also how the P2 SQL version will work (delete +
   * insert inside one transaction). */
  replaceAvailabilityRules(providerId: UUID, rules: AvailabilityRuleInput[]): Promise<ProviderAvailabilityRule[]>;
  /** Buffer / min-notice / max-advance are per session type in the schema
   * (architecture.md §10); the editor sets them across all of a provider's
   * types at once, which is what the paper workflow actually does. */
  updateSessionSettings(providerId: UUID, settings: SessionSettingsInput): Promise<ProviderSessionType[]>;
  addDayOff(providerId: UUID, input: DayOffInput): Promise<ProviderBlockout>;
  removeDayOff(providerId: UUID, blockoutId: UUID): Promise<void>;
  updateProfile(providerId: UUID, patch: ProviderProfilePatch): Promise<Provider>;
}

const IST_OFFSET_MIN = 330;

function istDayRange(dateISO: string): { startsAt: string; endsAt: string } {
  const startUTC = new Date(`${dateISO}T00:00:00.000Z`).getTime() - IST_OFFSET_MIN * 60_000;
  return {
    startsAt: new Date(startUTC).toISOString(),
    endsAt: new Date(startUTC + 86_400_000).toISOString(),
  };
}

export class MockProviderRepo implements ProviderRepo {
  async getById(id: UUID): Promise<Provider | null> {
    return providers.find((p) => p.id === id) ?? null;
  }
  async getBySlug(organizationId: UUID, slug: string): Promise<Provider | null> {
    return providers.find((p) => p.organizationId === organizationId && p.slug === slug) ?? null;
  }
  async listBookable(organizationId: UUID): Promise<ProviderProfile[]> {
    const bookable = providers.filter(
      (p) => p.organizationId === organizationId && p.isActive && p.isAcceptingPatients,
    );
    return Promise.all(bookable.map((p) => this.getProfile(p.id) as Promise<ProviderProfile>));
  }
  async listAll(organizationId: UUID): Promise<ProviderProfile[]> {
    const mine = providers.filter((p) => p.organizationId === organizationId);
    return Promise.all(mine.map((p) => this.getProfile(p.id) as Promise<ProviderProfile>));
  }
  async updateSessionType(
    providerId: UUID,
    sessionTypeId: UUID,
    patch: SessionTypePatch,
  ): Promise<ProviderSessionType> {
    const type = providerSessionTypes.find((s) => s.id === sessionTypeId && s.providerId === providerId);
    if (!type) throw new Error(`unknown session type: ${sessionTypeId}`);
    Object.assign(type, patch);
    type.updatedAt = new Date().toISOString();
    return type;
  }
  async getProfile(id: UUID): Promise<ProviderProfile | null> {
    const provider = providers.find((p) => p.id === id);
    if (!provider) return null;
    return { ...provider, sessionTypes: await this.listSessionTypes(id) };
  }
  async listSessionTypes(providerId: UUID): Promise<ProviderSessionType[]> {
    return providerSessionTypes.filter((s) => s.providerId === providerId && s.isActive);
  }
  async listAllSessionTypes(providerId: UUID): Promise<ProviderSessionType[]> {
    return providerSessionTypes
      .filter((s) => s.providerId === providerId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async listAvailabilityRules(providerId: UUID): Promise<ProviderAvailabilityRule[]> {
    return providerAvailabilityRules
      .filter((r) => r.providerId === providerId && r.isActive)
      .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
  }
  async listBlockouts(providerId: UUID): Promise<ProviderBlockout[]> {
    return providerBlockouts
      .filter((b) => b.providerId === providerId)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async replaceAvailabilityRules(
    providerId: UUID,
    rules: AvailabilityRuleInput[],
  ): Promise<ProviderAvailabilityRule[]> {
    const now = new Date().toISOString();
    for (let i = providerAvailabilityRules.length - 1; i >= 0; i -= 1) {
      if (providerAvailabilityRules[i]!.providerId === providerId) providerAvailabilityRules.splice(i, 1);
    }
    const created = rules.map((rule) => ({
      id: `avail_${randomUUID()}`,
      organizationId: ORG_ID,
      providerId,
      sessionTypeId: null,
      weekday: rule.weekday,
      startTime: rule.startTime,
      endTime: rule.endTime,
      validFrom: now.slice(0, 10),
      validUntil: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } satisfies ProviderAvailabilityRule));
    providerAvailabilityRules.push(...created);
    return created;
  }

  async updateSessionSettings(providerId: UUID, settings: SessionSettingsInput): Promise<ProviderSessionType[]> {
    const now = new Date().toISOString();
    const types = providerSessionTypes.filter((s) => s.providerId === providerId);
    for (const type of types) {
      type.bufferMinutes = settings.bufferMinutes;
      type.minNoticeHours = settings.minNoticeHours;
      type.maxAdvanceDays = settings.maxAdvanceDays;
      type.updatedAt = now;
    }
    return types;
  }

  async addDayOff(providerId: UUID, input: DayOffInput): Promise<ProviderBlockout> {
    const now = new Date().toISOString();
    const { startsAt, endsAt } = istDayRange(input.date);
    const blockout: ProviderBlockout = {
      id: `blockout_${randomUUID()}`,
      organizationId: ORG_ID,
      providerId,
      startsAt,
      endsAt,
      reason: input.reason,
      repeatsYearly: input.repeatsYearly,
      createdAt: now,
      updatedAt: now,
    };
    providerBlockouts.push(blockout);
    return blockout;
  }

  async removeDayOff(providerId: UUID, blockoutId: UUID): Promise<void> {
    const index = providerBlockouts.findIndex((b) => b.id === blockoutId && b.providerId === providerId);
    if (index >= 0) providerBlockouts.splice(index, 1);
  }

  async updateProfile(providerId: UUID, patch: ProviderProfilePatch): Promise<Provider> {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) throw new Error(`unknown provider: ${providerId}`);
    Object.assign(provider, patch);
    provider.updatedAt = new Date().toISOString();
    return provider;
  }
}
