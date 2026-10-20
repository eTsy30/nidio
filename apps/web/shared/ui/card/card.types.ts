import { type VariantProps } from "class-variance-authority";

import { cardVariants } from "./Card";
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  asChild?: boolean;
}
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;
