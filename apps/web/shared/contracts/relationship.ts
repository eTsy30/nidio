export interface CurrentCoupleResponse {
  id: string;
  workspaceId: string;
  partnerId: string;
  partnerFirstName: string | null;
  partnerAvatarUrl: string | null;
  createdAt: string;
  relationshipAt: string | null;
}
