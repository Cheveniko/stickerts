import AuthResend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import * as m from "../lib/paraglide/messages.js";
import { getLocaleFromUrl, messageOptions } from "./i18n";
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
        const locale = getLocaleFromUrl(url);
        const result = await resend.emails.send({
          from: provider.from ?? RESEND_LOGIN_FROM,
          to: email,
          subject: m.email_login_subject({}, messageOptions(locale)),
          html: `<div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;"><p>${m.email_login_html_intro({}, messageOptions(locale))}</p><p><a href="${url}">${url}</a></p></div>`,
          text: m.email_login_text({ url }, messageOptions(locale)),
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
        freeSellerContactsRemaining: 1,
      });
    },
  },
});
