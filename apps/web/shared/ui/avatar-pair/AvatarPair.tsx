import { Heart, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";

export interface AvatarPairProps {
  leftAvatar?: string | null | undefined;
  rightAvatar?: string | null | undefined;
  leftAlt?: string | undefined;
  rightAlt?: string | undefined;
  leftFallback?: React.ReactNode;
  rightFallback?: React.ReactNode;
  size?: "sm" | "default" | "lg";
  showHeart?: boolean;
  className?: string;
}

export function AvatarPair({
  leftAvatar,
  rightAvatar,
  leftAlt,
  rightAlt,
  leftFallback,
  rightFallback,
  size = "default",
  showHeart = true,
  className,
}: AvatarPairProps) {
  return (
    <div className={["inline-flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <Avatar size={size}>
        {leftAvatar ? (
          <AvatarImage src={leftAvatar} alt={leftAlt} />
        ) : (
          <AvatarFallback>{leftFallback ?? <User className="size-4" />}</AvatarFallback>
        )}
      </Avatar>

      {showHeart && (
        <Heart className="size-5 fill-primary text-primary transition-transform duration-200 hover:scale-110" />
      )}

      <Avatar size={size}>
        {rightAvatar ? (
          <AvatarImage src={rightAvatar} alt={rightAlt} />
        ) : (
          <AvatarFallback>{rightFallback ?? <User className="size-4" />}</AvatarFallback>
        )}
      </Avatar>
    </div>
  );
}
