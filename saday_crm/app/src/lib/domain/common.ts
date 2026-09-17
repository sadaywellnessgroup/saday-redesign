/* Shared primitive aliases used across every domain type. Derived from
   supabase/migrations/0001_schema.sql — money stays an integer number of
   paise (never a float, never a rupee string), every timestamp is an
   ISO-8601 UTC string, and role/language are the same closed unions the
   DB enforces with CHECK constraints (architecture.md §13). */

/** Integer paise. Never divide/multiply by 100 outside a display formatter. */
export type Paise = number;

/** ISO-8601 UTC instant, e.g. "2026-09-17T10:15:00.000Z". */
export type ISODateTime = string;

/** Calendar date only, "YYYY-MM-DD". */
export type ISODate = string;

export type Language = 'en' | 'hi';

export type Role = 'patient' | 'provider' | 'admin';

export type UUID = string;
