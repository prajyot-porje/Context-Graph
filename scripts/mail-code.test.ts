import { expect, it } from "vitest";
import { extractTestCode } from "./mail-code";
it("reads SMTP plain text and Gmail encodings without logging codes", () => {
  expect(extractTestCode("Your verification code: 123456")).toBe("123456");
  expect(extractTestCode("Your verification code:=20=\r\n123456")).toBe(
    "123456",
  );
  expect(
    extractTestCode(
      "Content-Transfer-Encoding: base64\r\n\r\n" +
        Buffer.from("Your verification code: 654321").toString("base64"),
    ),
  ).toBe("654321");
  expect(
    extractTestCode("No verification code in this test message"),
  ).toBeUndefined();
});
