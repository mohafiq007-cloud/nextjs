import test from "node:test";
import assert from "node:assert/strict";
import { publicCatalog, findScenario } from "../src/learning.mjs";
import worker from "../src/worker.mjs";

test("free preview catalog has three distinct reasoning labs", () => {
  const data = publicCatalog();
  assert.equal(data.mode, "preview");
  assert.equal(data.scenarios.length, 3);
  assert.equal(new Set(data.scenarios.map((s) => s.id)).size, 3);
  for (const s of data.scenarios) {
    assert.ok(s.prompt.length > 30);
    assert.ok(s.reflection.length > 40);
    assert.ok(findScenario(s.id));
  }
});
test("member routes fail closed when not enabled", async () => {
  const response = await worker.fetch(new Request("https://learn.marizhq.com/api/state"), { LEARN_API_ENABLED: "false" });
  assert.equal(response.status, 503);
});
test("catalog is public, never includes credentials", async () => {
  const response = await worker.fetch(new Request("https://learn.marizhq.com/api/catalog"), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).scenarios.length, 3);
});
test("member routes reject missing bearer tokens", async () => {
  const response = await worker.fetch(new Request("https://learn.marizhq.com/api/state"), { LEARN_API_ENABLED: "true" });
  assert.equal(response.status, 401);
});
