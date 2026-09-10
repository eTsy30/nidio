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

/**
 * Ответ GET /relationship/couple
 */
export type { CurrentCoupleResponse } from "@/shared/contracts/relationship";

/**
 * Запрос PATCH /relationship/couple
 */
export interface UpdateRelationshipRequest {
  relationshipAt: string | null;
}

/**
 * Ответ PATCH /relationship/couple
 */
export interface UpdateRelationshipResponse {
  id: string;
  relationshipAt: string | null;
}

/**
 * Ответ POST /relationship/invite/:token/accept
 */
export interface AcceptInviteResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LeaveCoupleResponse {
  success: boolean;
}
