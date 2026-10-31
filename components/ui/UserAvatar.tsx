import Image from "next/image";
export function UserAvatar({
  name,
  image,
  size = 40,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
}) {
  const initials = (name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return image ? (
    <Image
      src={image}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="cg-user-avatar"
    />
  ) : (
    <span className="cg-user-initials" aria-hidden="true">
      {initials}
    </span>
  );
}
