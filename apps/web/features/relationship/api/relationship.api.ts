import { http } from "@/shared/api/client/api";

import {
  CoupleResponse,
  CreateInviteResponse,
  CurrentInviteResponse,
  InviteResponse,
  LeaveCoupleResponse,
} from "../model/relationship.types";

export const createInvite = () => {
  return http.post<CreateInviteResponse>("/relationship/invite");
};

export const getCurrentInvite = () => {
  return http.get<CurrentInviteResponse>("/relationship/invite");
};

export const getInvite = (token: string) => {
  return http.get<InviteResponse>(`/relationship/invite/${token}`);
};

export const acceptInvite = (token: string) => {
  return http.post<CoupleResponse>(`/relationship/invite/${token}/accept`);
};

export const getCurrentCouple = () => {
  return http.get<CoupleResponse>("/relationship/couple");
};

export const leaveCouple = () => {
  return http.delete<LeaveCoupleResponse>("/relationship/couple");
};
