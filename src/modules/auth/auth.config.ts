import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    passkey({
      rpID:
        process.env.NODE_ENV === "production"
          ? new URL(process.env.BETTER_AUTH_URL || "https://localhost").hostname
          : "localhost",
      rpName: "Asystent AI",
      origin:
        process.env.BETTER_AUTH_URL || "http://localhost:3000",
    }),
  ],
});
