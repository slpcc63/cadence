import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("Cadence repository excludes Sentinel application runtime", () => {
  for (const path of [
    "products/time-card-manager",
    "lib/square-time-card-manager.ts",
    "lib/time-card-email-workflow.ts",
    "lib/time-card-missing-punch-workflow.ts",
    "app/app/time-card-manager"
  ]) assert.equal(existsSync(resolve(root, path)), false, path);
});

test("Cadence package exposes only Cadence build commands", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  assert.equal(manifest.name, "@slpcc63/cadence");
  assert.match(manifest.scripts.build, /products\/calendar-sync/);
  assert.doesNotMatch(JSON.stringify(manifest.scripts), /products\/time-card-manager/);
});
