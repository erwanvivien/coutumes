/** Shape returned by apps/web's /api/account/me — typed once so any client can use it
 * without duplicating the definition. Mirrors the Prisma User model's public fields. */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string | null;
};
