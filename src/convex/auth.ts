import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: "Stickerts <login@stickerts.com>",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to: email,
            subject: "Tu acceso a Stickerts",
            html: "",
            text: `Entra a Stickerts con este link:\n\n${url}\n`,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Resend error: ${JSON.stringify(await response.json())}`,
          );
        }
      },
    }),
  ],
});
