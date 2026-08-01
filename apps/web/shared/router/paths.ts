export type ArgsRoute = (...args: (string | number)[]) => string;
export type Route = string | ArgsRoute;

export const routes = {
  homepage: "/",
  login: "/login",
  registration: "/registration",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  invite: "/invite",
  inviteToken: "/invite/[token]",
  connected: "/connected",
} satisfies Record<string, Route>;
