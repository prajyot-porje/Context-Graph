import type { Metadata } from "next";
import LoginClient from "@/components/auth/LoginClient";
import { authDestination } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; email?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginClient
      destination={authDestination(params.from)}
      initialEmail={
        typeof params.email === "string" ? params.email.slice(0, 254) : ""
      }
      oauthError={!!params.error}
      googleEnabled={
        !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      }
    />
  );
}
