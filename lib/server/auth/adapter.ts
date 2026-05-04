import type {
  InputJsonObject,
  InputJsonValue,
} from "@/prisma/generated/internal/prismaNamespace";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { prismaClient } from "../db";

// Maps our User row to the shape NextAuth expects
const toAdapterUser = (user: {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null | undefined;
  emailVerifiedAt: Date | null;
}): AdapterUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.imageUrl ?? null,
  emailVerified: user.emailVerifiedAt ?? null,
});

export const prismaAdapter: Adapter = {
  async createUser(data) {
    // Split name back into firstname/lastname — providers send a single "name" string.
    // Apple sends no name on retry logins, and sometimes falls back to the email address.
    // When no usable name is available, derive parts from the email local part (e.g. "vivien.erwan@..." → ["vivien", "erwan"]).
    const rawName = (data.name ?? "").trim() || data.email.split("@")[0];

    const user = await prismaClient.user.create({
      data: {
        email: data.email,
        name: rawName,
        imageUrl: data.image,
        emailVerifiedAt: data.emailVerified,
      },
    });

    return toAdapterUser(user);
  },

  async getUser(id) {
    const user = await prismaClient.user.findUnique({
      where: { id },
    });

    return user !== null ? toAdapterUser(user) : null;
  },

  async getUserByEmail(email) {
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    return user !== null ? toAdapterUser(user) : null;
  },

  async getUserByAccount({ provider, providerAccountId }) {
    // conf is JSONB — filter by provider first, then match sub in-app.
    // This is fine at early scale; add a generated column index if needed later.
    const rows = await prismaClient.userAuth.findMany({
      select: {
        User: true,
        conf: true,
      },
      where: { provider: provider as "google" | "apple" },
    });

    const match = rows.find(
      (row) =>
        row.conf !== null &&
        typeof row.conf === "object" &&
        !Array.isArray(row.conf) &&
        (row.conf as Record<string, unknown>)["sub"] === providerAccountId
    );

    return match ? toAdapterUser(match.User) : null;
  },

  async updateUser(data) {
    const user = await prismaClient.user.update({
      data: {
        imageUrl: data.image ?? undefined,
        emailVerifiedAt: data.emailVerified ?? undefined,
      },
      where: { id: data.id },
    });

    return toAdapterUser(user);
  },

  async linkAccount(account: AdapterAccount) {
    const conf = buildConf(account);

    await prismaClient.userAuth.upsert({
      select: { userId: true },
      create: {
        userId: account.userId,
        provider: account.provider as "google" | "apple",
        conf,
      },
      update: { conf },
      where: {
        userId_provider: {
          userId: account.userId,
          provider: account.provider as "google" | "apple",
        },
      },
    });
  },
};

// Extracts the JSONB conf from NextAuth's AdapterAccount (which carries the decoded id_token)
const buildConf = (account: AdapterAccount): InputJsonObject => {
  const base = {
    sub: account.providerAccountId,
  } satisfies InputJsonObject;

  // AdapterAccount doesn't type provider-specific fields — cast to a typed bag
  const extra = account as Record<string, InputJsonValue | null | undefined>;

  if (account.provider === "google") {
    return {
      ...base,
      email: extra["email"],
      email_verified: extra["email_verified"],
      name: extra["name"],
      picture: extra["picture"],
    };
  }

  if (account.provider === "apple") {
    return {
      ...base,
      email: extra["email"],
      email_verified: extra["email_verified"],
      is_private_email: extra["is_private_email"],
      name: extra["name"],
    };
  }

  return base;
};
