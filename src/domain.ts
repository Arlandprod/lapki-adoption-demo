import type { ApplicationDraft, DraftErrors, Filters, Pet, Receipt } from './types';

export const DEFAULT_FILTERS: Filters = {
  species: 'all', housing: 'any', children: false, otherPets: 'any',
  energy: 'any', ageGroup: 'any', firstTime: false, specialCare: false,
};
export const EMPTY_DRAFT: ApplicationDraft = {
  housing: '', children: '', otherPets: '', experience: '', away: '',
  name: '', email: '', motivation: '', careAccepted: false, demoAccepted: false,
};
export const DEMO_DRAFT: ApplicationDraft = {
  housing: 'apartment', children: 'no', otherPets: 'none', experience: 'first', away: '0-4',
  name: 'Тестовый посетитель', email: 'friend@example.test',
  motivation: 'Хочу пройти учебный сценарий: подготовить спокойное место дома и познакомиться с привычками животного.',
  careAccepted: false, demoAccepted: false,
};
export function filterPets(pets: Pet[], filters: Filters): Pet[] {
  return pets.filter(pet =>
    (filters.species === 'all' || pet.species === filters.species) &&
    (filters.housing !== 'apartment' || pet.apartment) &&
    (!filters.children || pet.children === 'yes') &&
    (filters.otherPets === 'any' || (filters.otherPets === 'cat' ? pet.cats : pet.dogs) === 'yes') &&
    (filters.energy === 'any' || pet.energy === filters.energy) &&
    (filters.ageGroup === 'any' || pet.ageGroup === filters.ageGroup) &&
    (!filters.firstTime || pet.firstTime) && (!filters.specialCare || pet.specialCare),
  );
}
export function activeFilterCount(filters: Filters): number {
  return Object.entries(filters).filter(([key, value]) => value !== DEFAULT_FILTERS[key as keyof Filters]).length;
}
export function validateStep(draft: ApplicationDraft, step: number): DraftErrors {
  const errors: DraftErrors = {};
  if (step === 0) {
    if (!['apartment', 'house'].includes(draft.housing)) errors.housing = 'Выберите тип жилья.';
    if (!['yes', 'no'].includes(draft.children)) errors.children = 'Укажите, есть ли дети.';
    if (!['none', 'cat', 'dog'].includes(draft.otherPets)) errors.otherPets = 'Укажите других животных.';
    if (!['first', 'experienced'].includes(draft.experience)) errors.experience = 'Выберите ваш опыт.';
    if (!['0-4', '4-8', '8+'].includes(draft.away)) errors.away = 'Выберите время вне дома.';
  }
  if (step === 1) {
    if (draft.name.trim().length < 2) errors.name = 'Введите хотя бы 2 символа или используйте демо-данные.';
    if (draft.name.trim().length > 60) errors.name = 'Используйте не более 60 символов.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || draft.email.length > 100) errors.email = 'Введите адрес вида friend@example.test.';
    if (draft.motivation.trim().length < 20) errors.motivation = 'Напишите хотя бы 20 символов или используйте демо-данные.';
    if (draft.motivation.trim().length > 500) errors.motivation = 'Используйте не более 500 символов.';
  }
  if (step === 2) {
    if (!draft.careAccepted) errors.careAccepted = 'Подтвердите, что прочитали особенности животного.';
    if (!draft.demoAccepted) errors.demoAccepted = 'Подтвердите демонстрационный режим.';
  }
  return errors;
}
export function compatibilityNotes(pet: Pet, draft: ApplicationDraft): string[] {
  const notes: string[] = [];
  if (draft.housing === 'apartment' && !pet.apartment) notes.push('В анкете указан дом с огороженным участком. Квартира может не подойти.');
  if (draft.children === 'yes' && pet.children !== 'yes') notes.push(pet.children === 'no' ? 'В анкете рекомендован дом без детей.' : 'Совместимость с детьми не проверена.');
  if (draft.otherPets === 'cat' && pet.cats !== 'yes') notes.push('Совместимость с кошками требует отдельного обсуждения.');
  if (draft.otherPets === 'dog' && pet.dogs !== 'yes') notes.push('Совместимость с собаками требует отдельного обсуждения.');
  if (draft.experience === 'first' && !pet.firstTime) notes.push('В анкете рекомендован человек с опытом.');
  if (draft.away === '8+') notes.push('Если вас нет больше 8 часов, заранее продумайте помощь с уходом.');
  return notes;
}
export function parseFavoriteIds(raw: string | null, knownIds: string[]): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is string => typeof id === 'string' && knownIds.includes(id)))];
  } catch { return []; }
}
export function parseReceipts(raw: string | null, knownIds: string[]): Receipt[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    const ids = new Set<string>();
    const receipts: Receipt[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const { id, petId, createdAt } = item as Record<string, unknown>;
      if (typeof id !== 'string' || !/^DEMO-[A-Z0-9-]{8,40}$/.test(id) || ids.has(id) || typeof petId !== 'string' || !knownIds.includes(petId) || typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt))) continue;
      ids.add(id);
      // Keep only non-contact fields, including when reading malformed data.
      receipts.push({ id, petId, createdAt });
      if (receipts.length === 30) break;
    }
    return receipts;
  } catch { return []; }
}
