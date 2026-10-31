import { z } from "zod";
import type { Metadata } from "next";
import { requireSessionUser } from "@/lib/auth/server";
import { getSetupStatus } from "@/lib/db";
import { getBaseUrl } from "@/lib/auth-url";
import SetupClient from "@/components/connect/SetupClient";
export const metadata: Metadata = { title: "Set up ContextGraph" };
export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { attempt } = await searchParams;
  const selected = z.uuid().safeParse(attempt).success ? attempt : undefined;
  const user = await requireSessionUser();
  return (
    <SetupClient
      initial={await getSetupStatus(user.id, selected)}
      appUrl={getBaseUrl()}
    />
  );
}
