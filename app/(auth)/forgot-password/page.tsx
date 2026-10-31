import { AuthForm } from "@/components/auth/AuthForm";
import { authDestination } from "@/lib/navigation";

export const metadata = { title: "Password recovery" };
export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; from?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="recovery"
      destination={authDestination(params.from)}
      initialEmail={
        typeof params.email === "string" ? params.email.slice(0, 254) : ""
      }
    />
  );
}
