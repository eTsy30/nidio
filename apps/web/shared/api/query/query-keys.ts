export const queryKeys = {
  relationship: {
    invite: ["relationship", "invite"] as const,
    inviteByToken: (token: string) => ["relationship", "invite", token] as const,
    couple: ["relationship", "couple"] as const,
  },
} as const;
