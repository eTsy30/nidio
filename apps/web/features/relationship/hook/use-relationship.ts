import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { queryKeys } from "@/shared/api/query/query-keys";

import {
  acceptInvite,
  createInvite,
  getCurrentCouple,
  getCurrentInvite,
  getInvite,
  leaveCouple,
  updateRelationship,
} from "../api/relationship.api";
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

type ApiError = AxiosError<{
  message?: string;
}>;

export const useCreateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateInviteResponse, ApiError, void>({
    mutationFn: createInvite,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.invite,
      });
    },
  });
};

export const useCurrentInvite = () => {
  return useQuery<CurrentInviteResponse, ApiError>({
    queryKey: queryKeys.relationship.invite,
    queryFn: getCurrentInvite,
  });
};

export const useInvite = (token: string) => {
  return useQuery<InviteResponse, ApiError>({
    queryKey: queryKeys.relationship.inviteByToken(token),
    queryFn: () => getInvite(token),
    enabled: !!token,
  });
};

export const useAcceptInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<AcceptInviteResponse, ApiError, string>({
    mutationFn: acceptInvite,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.couple,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.invite,
      });
    },
  });
};

export const useCurrentCouple = () => {
  return useQuery<CurrentCoupleResponse, ApiError>({
    queryKey: queryKeys.relationship.couple,
    queryFn: getCurrentCouple,
  });
};

export const useUpdateRelationship = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateRelationshipResponse, ApiError, UpdateRelationshipRequest>({
    mutationFn: updateRelationship,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.couple,
      });
    },
  });
};

export const useLeaveCouple = () => {
  const queryClient = useQueryClient();

  return useMutation<LeaveCoupleResponse, ApiError, void>({
    mutationFn: leaveCouple,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.couple,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.relationship.invite,
      });
    },
  });
};
