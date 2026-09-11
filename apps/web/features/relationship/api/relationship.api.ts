import { http } from "@/shared/api/client/api";

import {
  AcceptInviteResponse,
  CreateInviteResponse,
  CurrentCoupleResponse,
  CurrentInviteResponse,
  InviteResponse,
  LeaveCoupleResponse,
  UpdateRelationshipRequest,
  UpdateRelationshipResponse,
} from "../model/relationship.types";

export const createInvite = (): Promise<CreateInviteResponse> => {
  return http.post<CreateInviteResponse>("/relationship/invite");
};

export const getCurrentInvite = (): Promise<CurrentInviteResponse> => {
  return http.get<CurrentInviteResponse>("/relationship/invite");
};

export const getInvite = (token: string): Promise<InviteResponse> => {
  return http.get<InviteResponse>(`/relationship/invite/${token}`);
};

export const acceptInvite = (token: string): Promise<AcceptInviteResponse> => {
  return http.post<AcceptInviteResponse>(`/relationship/invite/${token}/accept`);
};

export const getCurrentCouple = async (): Promise<CurrentCoupleResponse | null> => {
  const couple = await http.get<CurrentCoupleResponse | null | "">("/relationship/couple");
  // Nest serializes a null controller result as an empty HTTP body.
  return couple === "" ? null : couple;
};

export const updateRelationship = (
  data: UpdateRelationshipRequest,
): Promise<UpdateRelationshipResponse> => {
  return http.patch<UpdateRelationshipResponse>("/relationship/couple", data);
};

export const leaveCouple = (): Promise<LeaveCoupleResponse> => {
  return http.delete<LeaveCoupleResponse>("/relationship/couple");
};
