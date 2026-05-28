import AuthResend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { resend, RESEND_LOGIN_FROM } from "./resend";

function getDefaultNameFromEmail(email: string) {
  return email.split("@")[0]?.trim() ?? "";
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    AuthResend({
      apiKey: process.env.RESEND_API_KEY,
      from: RESEND_LOGIN_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const result = await resend.emails.send({
          from: provider.from ?? RESEND_LOGIN_FROM,
          to: email,
          subject: "Tu acceso a Stickerts",
          html: "",
          text: `Entra a Stickerts con este link:\n\n${url}\n`,
        });

        if (result.error) {
          throw new Error(`Resend error: ${result.error.message}`);
        }
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      const email = profile.email?.trim();
      if (!email) {
        throw new Error("Auth provider did not return an email.");
      }

      const derivedName = getDefaultNameFromEmail(email);
      if (!derivedName) {
        throw new Error("Auth provider returned an invalid email.");
      }

      const existingUser = existingUserId
        ? await ctx.db.get(existingUserId)
        : null;

      const userFields = {
        email,
        name: existingUser?.name?.trim() || derivedName,
        ...(profile.emailVerified ? { emailVerificationTime: Date.now() } : {}),
        ...(typeof profile.image === "string" && profile.image.trim()
          ? { image: profile.image }
          : {}),
      };

      if (existingUser) {
        await ctx.db.patch(existingUser._id, userFields);
        return existingUser._id;
      }

      return await ctx.db.insert("users", {
        ...userFields,
        freeSellerContactsRemaining: 2,
      });
    },
  },
});
