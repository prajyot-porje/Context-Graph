import type { Metadata } from "next";
import SettingsClient from "@/components/dashboard/SettingsClient";
import { getUserProfile, getSetupStatus } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await requireSessionUser();
  const [initialProfile, initialStatus] = await Promise.all([
    getUserProfile(user.id),
    getSetupStatus(user.id),
  ]);
  return (
    <SettingsClient
      initialProfile={initialProfile}
      initialStatus={initialStatus}
    />
  );
}
