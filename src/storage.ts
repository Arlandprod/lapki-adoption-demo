import { parseFavoriteIds, parseReceipts } from './domain';
import type { Receipt } from './types';
export const FAVORITES_KEY = 'lapki-demo:favorites:v1';
export const RECEIPTS_KEY = 'lapki-demo:receipts:v1';
export function readLocalState(knownIds: string[]) {
  try { return { favorites: parseFavoriteIds(localStorage.getItem(FAVORITES_KEY), knownIds), receipts: parseReceipts(localStorage.getItem(RECEIPTS_KEY), knownIds), available: true }; }
  catch { return { favorites: [], receipts: [], available: false }; }
}
export function saveFavorites(ids: string[]): boolean {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)); return true; } catch { return false; }
}
export function saveReceipts(receipts: Receipt[]): boolean {
  try { localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts.map(({ id, petId, createdAt }) => ({ id, petId, createdAt })))); return true; } catch { return false; }
}
export function clearLocalState(): boolean {
  try { localStorage.removeItem(FAVORITES_KEY); localStorage.removeItem(RECEIPTS_KEY); return true; } catch { return false; }
}
