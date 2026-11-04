import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pieces, chapters, chapterNames, findPiece } from "../src/components/sites/onde/content.mjs";

test("five works are split across two meaningful, non-overlapping chapters", () => {
  assert.deepEqual(chapters.map(chapter => chapter.length), [3, 2]);
  assert.deepEqual(chapterNames, ["物与形", "日常信号"]);
  assert.equal(new Set(chapters.flat()).size, pieces.length);
  assert.equal(new Set(pieces.map(piece => piece.id)).size, 5);
  for (const id of chapters.flat()) {
    const piece = findPiece(id);
    assert.ok(piece?.title && piece.description && piece.image && piece.position && piece.thumbPosition);
    assert.ok(existsSync(resolve("public", `.${piece.image}`)), piece.image);
  }
  assert.equal(findPiece("missing"), undefined);
});

test("the collection title is Liang Ping in the landing page and drawer", () => {
  const source = readFileSync(resolve("src/components/sites/onde/Experience.tsx"), "utf8");
  const gallery = readFileSync(resolve("src/components/sites/onde/Gallery.tsx"), "utf8");
  assert.match(gallery, /<h1>Liang Ping<\/h1>/);
  assert.match(source, /className="drawer-title">Liang Ping<\/div>/);
});
