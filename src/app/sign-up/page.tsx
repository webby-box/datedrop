import { redirect } from "next/navigation";

/** Google is both sign-in and sign-up — same OAuth flow. */
export default function SignUpPage() {
  redirect("/sign-in");
}
