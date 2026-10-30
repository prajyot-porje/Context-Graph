export function oauthQuery(
  params: Record<string, string | string[] | undefined>,
): string {
  if (typeof params.oauth_query === "string") return params.oauth_query;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    for (const item of Array.isArray(value)
      ? value
      : value === undefined
        ? []
        : [value])
      query.append(key, item);
  return query.has("client_id") ? query.toString() : "";
}
