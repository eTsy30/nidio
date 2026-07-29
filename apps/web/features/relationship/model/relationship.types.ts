export interface CreateInviteResponse {
  token: string;
  url: string;
  expiresAt: string;
}

export type CurrentInviteResponse = CreateInviteResponse;

export interface InviteResponse {
  valid: boolean;
  senderFirstName: string;
  senderAvatarUrl: string | null;
  expiresAt: string;
}

export interface CoupleResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LeaveCoupleResponse {
  success: boolean;
}
