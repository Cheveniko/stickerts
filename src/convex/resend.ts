import { Resend } from "resend";

export const RESEND_LOGIN_FROM = "Stickerts <login@stickerts.com>";
export const RESEND_NO_REPLY_FROM = "Stickerts <no-reply@stickerts.com>";

export const resend = new Resend(process.env.RESEND_API_KEY);
