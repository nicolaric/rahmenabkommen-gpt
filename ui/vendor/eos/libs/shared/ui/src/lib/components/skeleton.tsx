import { cn } from "@eos/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-slate-100 animate-pulse rounded-md dark:bg-slate-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
