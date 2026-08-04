export type ArgsRoute = (...args: (string | number)[]) => string;
export type Route = string | ArgsRoute;

export const routes = {
  login: "/login",
  registration: "/registration",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  invite: "/invite",
  inviteToken: "/invite/[token]",
  connected: "/connected",

  home: "/",
  chat: "/chat",
  calendar: "/calendar",
  space: "/space",
  profile: "/profile",
} satisfies Record<string, Route>;
