import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse bg-blue-100 rounded-lg ", className)}
      {...props}
    />
  );
}

export { Skeleton };
