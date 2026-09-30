import { DEFAULT_FILTERS, filterPets } from './domain';
import type { Filters, Pet } from './types';
import type { RefObject } from 'react';

interface Actions { getFavorites: () => string[]; replaceFavorites: (ids: string[]) => void; showPet: (pet: Pet) => void; }
interface BrowserTool { name: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown | Promise<unknown>; }
interface ModelContext { registerTool: (tool: BrowserTool, options: { signal: AbortSignal }) => void | Promise<void>; }

function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an object.');
  return input as Record<string, unknown>;
}
export function registerWebTools(pets: Pet[], actions: RefObject<Actions>) {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const tools: BrowserTool[] = [
    {
      name: 'list_demo_animals', description: 'Read fictional animal profiles, optionally filtering species. No real adoption availability is claimed.',
      inputSchema: { type: 'object', properties: { species: { type: 'string', enum: ['all', 'dog', 'cat'] } }, additionalProperties: false }, annotations: { readOnlyHint: true },
      execute(input) { const args = objectInput(input); if (Object.keys(args).some(key => key !== 'species') || (args.species !== undefined && !['all', 'dog', 'cat'].includes(String(args.species)))) throw new Error('Invalid species.');
        const filters: Filters = { ...DEFAULT_FILTERS, species: (args.species ?? 'all') as Filters['species'] };
        return { demo: true, animals: filterPets(pets, filters).map(({ id, name, species, age, headline }) => ({ id, name, species, age, headline, favorite: actions.current.getFavorites().includes(id) })) };
      },
    },
    {
      name: 'show_demo_animal', description: 'Open a fictional animal profile in the visible interface. Does not create or submit an application.',
      inputSchema: { type: 'object', properties: { petId: { type: 'string' } }, required: ['petId'], additionalProperties: false }, annotations: { readOnlyHint: false },
      async execute(input) { const args = objectInput(input); if (Object.keys(args).some(key => key !== 'petId')) throw new Error('Unexpected property.'); const pet = pets.find(item => item.id === args.petId); if (!pet) throw new Error('Unknown demo animal.'); actions.current.showPet(pet); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); return { demo: true, openedPetId: pet.id }; },
    },
    {
      name: 'set_demo_favorites', description: 'Replace device-local favorite fictional profiles with the given IDs. No application is submitted.',
      inputSchema: { type: 'object', properties: { petIds: { type: 'array', items: { type: 'string' }, uniqueItems: true, maxItems: 8 } }, required: ['petIds'], additionalProperties: false }, annotations: { readOnlyHint: false },
      async execute(input) { const args = objectInput(input); if (Object.keys(args).some(key => key !== 'petIds') || !Array.isArray(args.petIds) || args.petIds.length > pets.length || args.petIds.some(id => typeof id !== 'string' || !pets.some(pet => pet.id === id))) throw new Error('Unknown favorite IDs.'); const ids = [...new Set(args.petIds as string[])]; actions.current.replaceFavorites(ids); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); return { demo: true, favoriteIds: actions.current.getFavorites() }; },
    },
  ];
  for (const tool of tools) { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser API; UI remains available. */ } }
  return () => lifecycle.abort();
}
