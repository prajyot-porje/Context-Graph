import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/server";
import { getSetupStatus } from "@/lib/db";
export default async function EntryPage() {
  const user = await requireSessionUser();
  redirect((await getSetupStatus(user.id)).ready ? "/dashboard" : "/connect");
}
