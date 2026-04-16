import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { UserRole } from "@/generated/prisma/enums";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.JWT_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const rawEmail = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!rawEmail || !password) return null;

        const email = rawEmail.trim().toLowerCase();
        if (!email) return null;

        const { prisma } = await import("@/lib/prisma");

        // Keep defaults aligned with prisma/seed.ts so ALLOW_ENV_DEMO_LOGIN works even when
        // DEMO_USER_PASSWORD is unset (previously that skipped the demo branch entirely → CredentialsSignin).
        const adminEmail = (process.env.ADMIN_EMAIL?.trim() || "admin@chaesfood.local").toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD ?? "AdminChaesFood2026!";
        const demoEmail = (process.env.DEMO_USER_EMAIL?.trim() || adminEmail).toLowerCase();
        const demoPassword =
          process.env.DEMO_USER_PASSWORD?.trim() ||
          process.env.ADMIN_PASSWORD?.trim() ||
          adminPassword;
        const allowEnvDemo = process.env.ALLOW_ENV_DEMO_LOGIN === "true";

        if (allowEnvDemo) {
          const matchesDemoPair = email === demoEmail && password === demoPassword;
          const matchesAdminPair = email === adminEmail && password === adminPassword;
          if (matchesDemoPair || matchesAdminPair) {
            const passwordHash = await hash(password, 12);
            const user = await prisma.user.upsert({
              where: { email },
              create: {
                email,
                passwordHash,
                name: "Site Admin",
                role: UserRole.ADMIN,
              },
              update: {
                passwordHash,
                role: UserRole.ADMIN,
                name: "Site Admin",
              },
            });
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        }

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        if (!user) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role ?? UserRole.CUSTOMER;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role =
          (token.role as (typeof UserRole)[keyof typeof UserRole]) ?? UserRole.CUSTOMER;
      }
      return session;
    },
  },
});
