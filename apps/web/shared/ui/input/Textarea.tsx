import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

import { fieldClassName } from "./InputControl";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldClassName, "min-h-24 resize-y p-3", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
