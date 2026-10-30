export function authDestination(value: unknown): string {
  if (
    typeof value === "string" &&
    value.startsWith("/oauth/login?") &&
    !value.includes("\\") &&
    !/[\r\n]/.test(value)
  )
    return value;
  return "/entry";
}
