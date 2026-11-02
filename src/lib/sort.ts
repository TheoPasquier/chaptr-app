import type { Manga, SortKey } from "@/types";
import { initialOf, lastReadAt } from "./format";

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function topChapter(m: Manga): number {
  return m.chapters.length ? Math.max(...m.chapters.map((c) => c.num)) : -Infinity;
}

export function filterAndSort(mangas: Manga[], query: string, letter: string, sort: SortKey): Manga[] {
  const q = fold(query.trim());
  const list = mangas.filter((m) => {
    const matchesQuery =
      !q || fold(m.title).includes(q) || m.aliases.some((a) => fold(a).includes(q));
    const matchesLetter = letter === "#" || initialOf(m.title) === letter;
    return matchesQuery && matchesLetter;
  });

  switch (sort) {
    case "recent":
      return list.sort((a, b) => lastReadAt(b) - lastReadAt(a));
    case "added":
      return list.sort((a, b) => b.addedAt - a.addedAt);
    case "title":
      return list.sort((a, b) => collator.compare(a.title, b.title));
    case "chapter":
      return list.sort((a, b) => topChapter(b) - topChapter(a));
  }
}

/** Lettres qui ont au moins un titre, pour griser les autres dans le rail. */
export function usedInitials(mangas: Manga[]): Set<string> {
  return new Set(mangas.map((m) => initialOf(m.title)));
}
