import type { Metadata } from "next";
import SignupClient from "@/components/auth/SignupClient";
import { authDestination } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; email?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <SignupClient
      destination={authDestination(params.from)}
      initialEmail={
        typeof params.email === "string" ? params.email.slice(0, 254) : ""
      }
      googleEnabled={
        !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      }
    />
  );
}
