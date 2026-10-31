import { describe, it, expect } from "vitest";
import { profileSchema, supportedAvatar } from "./profile";
describe("profile validation", () => {
  it("accepts bounded names and only controlled image formats", () => {
    expect(
      profileSchema.parse({ name: "  Alice  ", image: "/avatars/orbit.svg" })
        .name,
    ).toBe("Alice");
    expect(
      profileSchema.parse({ name: "Alice", image: null }).image,
    ).toBeNull();
    for (const image of [
      "https://tracking.example/avatar.svg",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "/avatars/../../api/settings/export",
      "data:image/jpeg;base64,aGVsbG8=",
    ]) {
      expect(supportedAvatar(image)).toBe(false);
    }
    expect(profileSchema.safeParse({ name: " ", image: null }).success).toBe(
      false,
    );
    expect(
      profileSchema.safeParse({ name: "Alice", email: "other@example.test" })
        .success,
    ).toBe(false);
  });
});
