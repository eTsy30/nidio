export type Gender = "MALE" | "FEMALE" | "UNSPECIFIED";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RelationshipPartner {
  id: string;
  firstName: string;
  avatarUrl: string | null;
}

export interface UserRelationship {
  connected: boolean;
  coupleId: string;
  workspaceId: string;
  partner: RelationshipPartner;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  avatarUrl: string | null;
  gender: Gender;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  relationship: UserRelationship | null;
}
