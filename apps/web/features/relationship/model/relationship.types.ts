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
export type { CurrentCoupleResponse } from "@/shared/contracts/relationship";
export interface UpdateRelationshipRequest {
  relationshipAt: string | null;
}
export interface UpdateRelationshipResponse {
  id: string;
  relationshipAt: string | null;
}
export interface AcceptInviteResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LeaveCoupleResponse {
  success: boolean;
}
