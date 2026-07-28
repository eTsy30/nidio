export type ArgsRoute = (...args: (string | number)[]) => string;
export type Route = string | ArgsRoute;

export const routes = {
  homepage: "/",
  login: "/login",
  registration: "/registration",
  forgotPassword: "/forgotPassword",
  // recoverReset: '/password/reset',
  // emailResend: '/email/resend',
  // emailConfirm: (token) => `/email/confirm/${token}`,
} satisfies Record<string, Route>;
