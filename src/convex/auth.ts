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
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (!user?.email || user.name?.trim()) {
        return;
      }

      const derivedName = getDefaultNameFromEmail(user.email);
      if (!derivedName) {
        return;
      }

      await ctx.db.patch(userId, {
        name: derivedName,
      });
    },
  },
});
