import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "@/src/lib/env";

const isProd = process.env.NODE_ENV === "production";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: getAuthSecret(),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  useSecureCookies: isProd,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string | null) ?? session.user.name;
      }
      return session;
    },
  },
};
