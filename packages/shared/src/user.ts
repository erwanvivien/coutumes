/** Shape returned by apps/web's /api/account/me — used by apps/mobile to type the signed-in
 * user without duplicating the definition. Mirrors the Prisma User model's public fields. */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string | null;
};
