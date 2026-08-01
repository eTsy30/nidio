export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface Partner {
  id: string;
  firstName: string | null;
  avatarUrl: string | null;
}

export interface Relationship {
  connected: boolean;
  coupleId: string | null;
  workspaceId: string | null;
  partner: Partner | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  avatarUrl: string | null;
  gender: "MALE" | "FEMALE" | "UNSPECIFIED";
  createdAt: string;
  relationship: Relationship;
}
