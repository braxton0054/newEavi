import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.AUTH_SECRET!,
  baseURL: process.env.NEXTAUTH_URL!,
  session: {
    expiresIn: 60 * 60 * 24 * 30,      // 30 days
    updateAge: 60 * 60 * 24,           // refresh if used within 1 day of expiry
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    useSecureCookies: false,
  },
  trustedOrigins: [
    "http://5.189.191.35:4000",
    "https://eavi.college.eavi.shop",
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
      },
      campus: {
        type: "string",
        required: false,
      },
    },
  },
});
