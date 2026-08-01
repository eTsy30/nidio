import { http } from "@/shared/api/client/api";

import {
  CoupleResponse,
  CreateInviteResponse,
  CurrentInviteResponse,
  InviteResponse,
  LeaveCoupleResponse,
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

export const acceptInvite = (token: string): Promise<CoupleResponse> => {
  return http.post<CoupleResponse>(`/relationship/invite/${token}/accept`);
};

export const getCurrentCouple = (): Promise<CoupleResponse> => {
  return http.get<CoupleResponse>("/relationship/couple");
};

export const leaveCouple = (): Promise<LeaveCoupleResponse> => {
  return http.delete<LeaveCoupleResponse>("/relationship/couple");
};
