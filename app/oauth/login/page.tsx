import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import OAuthAction from "@/components/connect/OAuthAction";
import { oauthQuery } from "@/lib/oauth-query";
export default async function OAuthLogin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = oauthQuery(await searchParams);
  if (!query) redirect("/connect");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    redirect(
      `/login?from=${encodeURIComponent(`/oauth/login?oauth_query=${encodeURIComponent(query)}`)}`,
    );
  return <OAuthAction query={query} consent={false} />;
}
