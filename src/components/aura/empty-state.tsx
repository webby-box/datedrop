import Link from "next/link";
import { cn } from "@/lib/utils";

export function EmptyState({
  kicker = "Nothing here yet",
  title,
  body,
  href,
  cta,
  className,
}: {
  kicker?: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
  className?: string;
}) {
  return (
    <div className={cn("card-light rounded-[var(--radius-xl)] px-6 py-14 text-center md:px-10", className)}>
      <p className="kicker">{kicker}</p>
      <h2 className="serif-italic mt-3 text-3xl text-[var(--ink)] md:text-[2.15rem]">{title}</h2>
      <p className="page-lead mx-auto mt-3 max-w-md">{body}</p>
      {href && cta ? (
        <Link
          href={href}
          className="focus-ring mt-7 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--ink)] px-5 text-sm font-medium text-white transition hover:bg-black"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
