import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: "sm" | "default" | "lg";
  className?: string;
}
export type AvatarRootProps = AvatarPrimitive.Root.Props & AvatarProps;
