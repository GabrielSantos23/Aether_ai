import { cn } from "@/lib/utils";
import NextLink, { LinkProps } from "next/link";
import { forwardRef } from "react";

type LinkPropsType = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps
> &
  LinkProps & {
    children?: React.ReactNode;
  } & React.RefAttributes<HTMLAnchorElement>;

export const Link = forwardRef<HTMLAnchorElement, LinkPropsType>(function Link(
  { className, children, ...props },
  ref
) {
  return (
    <NextLink
      ref={ref}
      className={cn(
        "font-medium text-primary underline underline-offset-4 hover:no-underline cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </NextLink>
  );
});
