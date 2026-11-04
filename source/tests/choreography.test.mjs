import { test } from "node:test";
import assert from "node:assert/strict";
import { dragDestination, locate, wipeRadius } from "../src/components/sites/onde/choreography.mjs";

test("a short tap does not change chapters; a deliberate horizontal swipe does", () => {
  assert.equal(dragDestination(0, -18, 4, 390), 0);
  assert.equal(dragDestination(0, -89, 14, 390), 1);
  assert.equal(dragDestination(1, 109, 10, 390), 0);
  assert.equal(dragDestination(0, -89, 120, 390), 0);
  assert.equal(dragDestination(1, -89, 0, 390), 1);
});

test("direct links select the actual piece chapter and old or invalid links recover", () => {
  assert.deepEqual(locate("#signal"), { chapter: 1, id: "signal" });
  assert.deepEqual(locate("#chapter-2"), { chapter: 1, id: null });
  assert.deepEqual(locate("#bogus"), { chapter: 0, id: null });
});

test("the optical transition covers even the most distant viewport corner", () => {
  assert.ok(wipeRadius(0, 0, 800, 600) >= 1000);
  assert.ok(wipeRadius(400, 300, 800, 600) >= 500);
  assert.ok(wipeRadius(400, 300, 800, 600) < 505);
});
