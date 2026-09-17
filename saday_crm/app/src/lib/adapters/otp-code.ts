/* Split out from otp.ts so this one constant can be imported by Client
 * Components (the /login stub form) without pulling `node:crypto` /
 * `node:fs` (used by the adapter + its dev-outbox writer) into the browser
 * bundle. */
export const STUB_OTP_CODE = '000000';
