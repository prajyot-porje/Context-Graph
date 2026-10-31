import { z } from "zod";
export const avatarChoices = ["orbit", "spark", "grid"] as const;
export function supportedAvatar(value: string) {
  if (avatarChoices.some((name) => value === `/avatars/${name}.svg`))
    return true;
  if (
    value.length > 24000 ||
    !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    return false;
  try {
    const bytes = Uint8Array.from(atob(value.slice(23)), (c) =>
      c.charCodeAt(0),
    );
    if (
      bytes[0] !== 255 ||
      bytes[1] !== 216 ||
      bytes[bytes.length - 2] !== 255 ||
      bytes[bytes.length - 1] !== 217
    )
      return false;
    for (let i = 2; i + 8 < bytes.length;) {
      if (bytes[i] !== 255) return false;
      const marker = bytes[i + 1],
        length = (bytes[i + 2] << 8) | bytes[i + 3];
      if (length < 2 || i + 2 + length > bytes.length) return false;
      if ([192, 193, 194].includes(marker)) {
        const height = (bytes[i + 5] << 8) | bytes[i + 6],
          width = (bytes[i + 7] << 8) | bytes[i + 8];
        return height > 0 && width > 0 && height <= 256 && width <= 256;
      }
      i += 2 + length;
    }
  } catch {
    return false;
  }
  return false;
}
export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    image: z
      .string()
      .refine(
        supportedAvatar,
        "Choose a built-in icon or upload a small profile photo.",
      )
      .nullable()
      .optional(),
  })
  .strict();
