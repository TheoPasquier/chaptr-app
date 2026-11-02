export interface Chapter {
  /** Numéro du chapitre (clé unique au sein d'une série). */
  num: number;
  name: string;
  /** Date de lecture (timestamp ms). */
  date: number;
  memo: string;
}

export type MangaStatus = "RELEASING" | "FINISHED" | "HIATUS" | "CANCELLED" | "NOT_YET_RELEASED";

export const STATUS_LABELS: Record<MangaStatus, string> = {
  RELEASING: "En cours",
  FINISHED: "Terminée",
  HIATUS: "En pause",
  CANCELLED: "Annulée",
  NOT_YET_RELEASED: "À paraître",
};

export interface Manga {
  id: string;
  addedAt: number;
  title: string;
  aliases: string[];
  /** Data URL ou URL http(s). Vide si aucune. */
  cover: string;
  banner: string;
  description: string;
  chapters: Chapter[];
  /** Nombre total de chapitres publiés, si connu. */
  totalChapters?: number;
  status?: MangaStatus;
  /** Identifiant AniList quand la fiche en provient. */
  anilistId?: number;
}

export type MangaInput = Omit<Manga, "id" | "addedAt">;

export type SortKey = "recent" | "added" | "title" | "chapter";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Lu récemment" },
  { key: "added", label: "Ajouté récemment" },
  { key: "title", label: "Titre, de A à Z" },
  { key: "chapter", label: "Chapitre le plus avancé" },
];

export type ThemeSetting = "system" | "light" | "dark";
