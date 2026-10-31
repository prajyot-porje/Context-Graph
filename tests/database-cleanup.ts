import type EmbeddedPostgres from "embedded-postgres";
import { rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

export async function stopTestDatabase(
  database: EmbeddedPostgres,
  directory: string,
) {
  try {
    await database.stop();
  } catch (error) {
    // embedded-postgres stops the process before removing its files, but does
    // not retry Windows antivirus/file-handle release races during removal.
    const code =
      typeof error === "object" && error && "code" in error ? error.code : "";
    if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(String(code))) throw error;
    const target = resolve(directory);
    if (
      dirname(target).toLowerCase() !== resolve(tmpdir()).toLowerCase() ||
      !/^contextgraph-(unit|test)-/.test(basename(target))
    )
      throw error;
    await rm(target, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
}
