import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[var(--radius-md)]", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card-light overflow-hidden rounded-[var(--radius-xl)]">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4 md:p-5">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-6 w-3/4 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}
