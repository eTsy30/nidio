import { cn } from "@/shared/lib/cn";

import { Button, type ButtonProps } from "./Button";

type Props = Omit<ButtonProps, "variant" | "aria-pressed"> & { selected: boolean };

/** A persistent choice, announced to assistive technology as pressed/unpressed. */
export function ChoiceButton({ selected, className, ...props }: Props) {
  return (
    <Button
      {...props}
      variant={selected ? "primary" : "secondary"}
      aria-pressed={selected}
      className={cn("min-h-11", className)}
    />
  );
}
