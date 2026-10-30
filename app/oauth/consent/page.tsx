import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import OAuthAction from "@/components/connect/OAuthAction";
import { oauthQuery } from "@/lib/oauth-query";
export default async function OAuthConsent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = oauthQuery(await searchParams);
  if (!query) redirect("/connect");
  if (!(await auth.api.getSession({ headers: await headers() })))
    redirect(`/oauth/login?oauth_query=${encodeURIComponent(query)}`);
  const parameters=new URLSearchParams(query);
  const client=await auth.api.getOAuthClientPublic({headers:await headers(),query:{client_id:parameters.get('client_id')||''}});
  return <OAuthAction query={query} consent clientName={client.client_name || client.client_id} scopes={parameters.get('scope')||''}/>;
}
