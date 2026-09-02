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
    <div className={cn("card-light rounded-[28px] px-6 py-12 text-center", className)}>
      <p className="kicker">{kicker}</p>
      <h2 className="serif-italic mt-3 text-3xl text-[#111]">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6b6b6b]">{body}</p>
      {href && cta ? (
        <Link
          href={href}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
