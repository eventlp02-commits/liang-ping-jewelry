import { chapters } from "./content.mjs";

export function locate(hash) {
  const value = hash.replace(/^#/, "");
  const chapter = chapters.findIndex(ids => ids.includes(value));
  return chapter < 0 ? { chapter: value === "chapter-2" ? 1 : 0, id: null } : { chapter, id: value };
}

export function dragDestination(chapter, dx, dy, width) {
  if (Math.abs(dx) < Math.abs(dy) * 1.35 || Math.abs(dx) < Math.min(95, width * .14)) return chapter;
  return Math.min(chapters.length - 1, Math.max(0, chapter + (dx < 0 ? 1 : -1)));
}

export function wipeRadius(x, y, width, height) {
  return Math.ceil(Math.hypot(Math.max(x, width - x), Math.max(y, height - y))) + 2;
}
