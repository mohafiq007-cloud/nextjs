import test from "node:test";
import assert from "node:assert/strict";
import { publicCatalog, findScenario } from "../src/learning.mjs";
import worker from "../src/worker.mjs";

test("free preview catalog has nine distinct reasoning challenges", () => {
  const data = publicCatalog();
  assert.equal(data.mode, "preview");
  assert.equal(data.scenarios.length, 9);
  assert.equal(new Set(data.scenarios.map((s) => s.id)).size, 3);
  for (const s of data.scenarios) {
    assert.ok(s.prompt.length > 30);
    assert.ok(s.reflection.length > 40);
    assert.ok(s.nextStep.length > 20);
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
  assert.equal((await response.json()).scenarios.length, 9);
});
test("member routes reject missing bearer tokens", async () => {
  const response = await worker.fetch(new Request("https://learn.marizhq.com/api/state"), { LEARN_API_ENABLED: "true" });
  assert.equal(response.status, 401);
});

test("each preview subject has three practice scenarios without grades", () => {
  const data = publicCatalog();
  const faculties = ["Human intelligence", "Financial intelligence", "Design and systems intelligence"];
  for (const faculty of faculties) {
    assert.equal(data.scenarios.filter((scenario) => scenario.faculty === faculty).length, 3);
  }
  assert.ok(data.scenarios.every((scenario) => !("score" in scenario) && !("rank" in scenario)));
  assert.ok(data.scenarios.every((scenario) => !("answer" in scenario)));
});

test("anonymous attempts are not accepted even with member service switched on", async () => {
  const response = await worker.fetch(
    new Request("https://learn.marizhq.com/api/attempt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenarioId: "observe-cafe-01", response: "I would check for evidence." })
    }),
    { LEARN_API_ENABLED: "true" }
  );
  assert.equal(response.status, 401);
});

test("unsupported API routes remain private when member service is disabled", async () => {
  const response = await worker.fetch(
    new Request("https://learn.marizhq.com/api/anything"),
    { LEARN_API_ENABLED: "false" }
  );
  assert.equal(response.status, 503);
});
