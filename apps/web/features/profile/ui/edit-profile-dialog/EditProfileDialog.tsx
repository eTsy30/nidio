"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";

import {
  updateProfile,
  type UpdateProfileRequest,
  uploadProfileImage,
} from "@/features/profile/api/profile.api";
import {
  type EditProfileFormData,
  editProfileSchema,
} from "@/features/profile/model/edit-profile.schema";
import { ApiError } from "@/shared/api/client/api";
import { queryKeys } from "@/shared/api/query/query-keys";
import type { User } from "@/shared/contracts/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar-pair/Avatar";
import { Button } from "@/shared/ui/button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";
import { Input } from "@/shared/ui/input/Input";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

interface EditProfileDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ user, open, onOpenChange }: EditProfileDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    mode: "onChange",
    defaultValues: {
      firstName: user.firstName ?? "",
      gender: user.gender,
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      firstName: user.firstName ?? "",
      gender: user.gender,
    });
  }, [open, user, reset]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const uploadMutation = useMutation({
    mutationFn: uploadProfileImage,

    onSuccess: () => {
      setUploadError(null);
    },

    onError: (error: ApiError) => {
      setUploadError(
        error.response?.data?.message ?? error.message ?? "Не удалось загрузить изображение",
      );
    },
  });

  const updateMutation = useMutation<User, ApiError, UpdateProfileRequest>({
    mutationFn: updateProfile,

    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User>(queryKeys.auth.user, updatedUser);

      onOpenChange(false);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadError(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    onOpenChange(nextOpen);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      setUploadError("Поддерживаются только изображения JPG, PNG и WebP");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("Размер изображения не должен превышать 5 МБ");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit: SubmitHandler<EditProfileFormData> = async (data) => {
    setUploadError(null);

    let avatarUrl = user.avatarUrl;

    if (selectedFile) {
      try {
        const uploadedImage = await uploadMutation.mutateAsync(selectedFile);

        avatarUrl = uploadedImage.url;
      } catch {
        return;
      }
    }

    updateMutation.mutate({
      firstName: data.firstName.trim(),
      avatarUrl,
      gender: data.gender,
    });
  };

  const mutationError =
    updateMutation.error?.response?.data?.message ??
    updateMutation.error?.message ??
    "Не удалось сохранить изменения";

  const isPending = uploadMutation.isPending || updateMutation.isPending;

  const displayName = user.firstName?.trim() || "Пользователь";

  const fallback = displayName.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактирование профиля</DialogTitle>

          <DialogDescription>Измените данные своего профиля.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar size="lg" className="size-24">
                <AvatarImage src={previewUrl ?? user.avatarUrl ?? undefined} alt={displayName} />

                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveSelectedFile}
                  disabled={isPending}
                  aria-label="Отменить выбранное изображение"
                  className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />

              {selectedFile ? "Изменить фото" : "Выбрать фото"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">JPG, PNG или WebP, до 5 МБ</p>
          </div>

          <Input
            label="Имя"
            required
            placeholder="Ваше имя"
            maxLength={50}
            state={errors.firstName ? "error" : "default"}
            error={errors.firstName?.message}
            {...register("firstName")}
          />

          <div className="flex flex-col gap-2">
            <label
              htmlFor="profile-gender"
              className="text-sm font-semibold leading-5 text-foreground"
            >
              Пол
            </label>

            <select
              id="profile-gender"
              {...register("gender")}
              disabled={isPending}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="UNSPECIFIED">Не указан</option>

              <option value="MALE">Мужской</option>

              <option value="FEMALE">Женский</option>
            </select>
          </div>

          {(uploadError || updateMutation.isError) && (
            <p role="alert" className="text-sm text-destructive">
              {uploadError ?? mutationError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Отмена
            </Button>

            <Button type="submit" disabled={!isValid || isPending} loading={isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
