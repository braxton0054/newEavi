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
