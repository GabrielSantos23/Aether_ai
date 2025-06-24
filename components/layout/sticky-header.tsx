import { cn } from "@/lib/utils";

export const StickyHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadElement>) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur",
        className
      )}
      {...props}
    />
  );
};
