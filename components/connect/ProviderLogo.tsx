import Image from "next/image";
import { Plug } from "lucide-react";

export function ProviderLogo({
  provider,
  size = 32,
}: {
  provider: "claude" | "chatgpt" | "other";
  size?: number;
}) {
  if (provider === "other") return <Plug size={size} aria-hidden="true" />;
  return (
    <Image
      src={`/brands/${provider === "chatgpt" ? "openai" : "claude"}.svg`}
      alt=""
      width={size}
      height={size}
      className="cg-provider-logo"
      unoptimized
    />
  );
}
