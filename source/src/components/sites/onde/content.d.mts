export interface Piece {
  id: string; title: string; subtitle: string; image: string; position: string; thumbPosition: string;
  color: string; ink: string; description: string; detail: string; tone: number;
}
export const pieces: Piece[];
export const chapters: string[][];
export const chapterNames: string[];
export function findPiece(id: string): Piece | undefined;
