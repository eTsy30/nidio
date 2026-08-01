export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
  },
  relationship: {
    invite: ["relationship", "invite"] as const,
    inviteByToken: (token: string) => ["relationship", "invite", token] as const,
    couple: ["relationship", "couple"] as const,
  },
} as const;
