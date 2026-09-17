import { cookies } from 'next/headers';
import type { Sex } from '@/lib/domain';

export const INTAKE_COOKIE = 'saday_intake';

export interface IntakeData {
  name: string;
  age: number;
  sex: Sex;
}

export async function getIntake(): Promise<IntakeData | null> {
  const store = await cookies();
  const raw = store.get(INTAKE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<IntakeData>;
    if (!parsed.name || typeof parsed.age !== 'number' || !parsed.sex) return null;
    return { name: parsed.name, age: parsed.age, sex: parsed.sex };
  } catch {
    return null;
  }
}
