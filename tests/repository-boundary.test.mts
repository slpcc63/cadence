import vm from "node:vm";
import ts from "typescript";
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


test("Square adapter contains only this product's required capabilities", () => {
  const source = readFileSync(resolve(root, "lib/square.ts"), "utf8");
  assert.doesNotMatch(source, /\bsearchSquareOpenTimecards\b/);
  assert.doesNotMatch(source, /\bsearchSquareTimecardsByWorkday\b/);
  assert.doesNotMatch(source, /\bretrieveSquareTimecard\b/);
  assert.doesNotMatch(source, /\bcreateSquareTimecard\b/);
  assert.doesNotMatch(source, /\bupdateSquareTimecard\b/);
  assert.doesNotMatch(source, /\blistSquareTeamMemberWages\b/);
  assert.doesNotMatch(source, /\bSquareTimecard\b/);
  assert.doesNotMatch(source, /\bSquareTeamMemberWage\b/);
  assert.match(source, /export async function searchSquareScheduledShifts/);
  assert.match(source, /const supportedPluginId: SquarePluginId = "square-calendar-sink"/);
  assert.match(source, /assertSupportedPlugin\(pluginId\)/);
});


test("Square adapter rejects the other product before reading configuration", () => {
  const source = readFileSync(resolve(root, "lib/square.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022
  }}).outputText;
  const exports: Record<string, (...args: any[]) => any> = {};
  const configurationReads: string[] = [];
  vm.runInNewContext(compiled, { exports, require: (name: string) => {
    if (name === "@/lib/square-product-config") return {
      getSquareProductEnvironmentValue: (id: string) => { configurationReads.push(id); return ""; },
      getSquareProductRedirectUri: (id: string) => { configurationReads.push(id); return ""; }
    };
    return {};
  }});
  for (const name of ["getSquareScopes", "getSquareAppId", "getSquareAppSecret", "getSquareRedirectUri"]) {
    assert.throws(() => exports[name]("square-time-card-manager"), /Unsupported Square product/);
  }
  assert.deepEqual(configurationReads, []);
  const scopes = Array.from(exports.getSquareScopes("square-calendar-sink"));
  assert.equal(scopes.includes("TIMECARDS_WRITE"), false);
  assert.deepEqual(configurationReads, ["square-calendar-sink"]);
});
