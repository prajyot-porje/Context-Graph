import type { Metadata } from "next";
import { requireSessionUser } from "@/lib/auth/server";
import { getSetupStatus } from "@/lib/db";
import { getBaseUrl } from "@/lib/auth-url";
import SetupClient from "@/components/connect/SetupClient";
export const metadata: Metadata = { title: "Set up ContextGraph" };
export default async function ConnectPage() {
  const user = await requireSessionUser();
  return (
    <SetupClient initial={await getSetupStatus(user.id)} appUrl={getBaseUrl()} />
  );
}
