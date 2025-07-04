import { cn } from "@/lib/utils";

export const Code = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    />
  );
};
