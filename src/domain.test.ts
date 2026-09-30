import { describe, expect, it } from 'vitest';
import { pets } from './data/pets';
import { compatibilityNotes, DEFAULT_FILTERS, DEMO_DRAFT, EMPTY_DRAFT, filterPets, parseFavoriteIds, parseReceipts, validateStep } from './domain';

describe('Home and animal matching', () => {
  it('excludes unknown and negative cat compatibility', () => {
    expect(filterPets(pets, { ...DEFAULT_FILTERS, otherPets: 'cat' }).map(p => p.id)).toEqual(['iris', 'mars', 'iskra']);
  });
  it('combines housing, children, energy, experience and special care', () => {
    expect(filterPets(pets, { ...DEFAULT_FILTERS, housing: 'apartment', children: true, energy: 'calm', firstTime: true, specialCare: true, otherPets: 'cat' }).map(p => p.id)).toEqual(['mars']);
  });
  it('excludes a house-only animal from apartment results', () => {
    expect(filterPets(pets, { ...DEFAULT_FILTERS, housing: 'apartment' }).map(p => p.id)).not.toContain('taiga');
    expect(filterPets(pets, DEFAULT_FILTERS)).toHaveLength(8);
  });
  it('has a real empty result for an incompatible set of conditions', () => {
    expect(filterPets(pets, { ...DEFAULT_FILTERS, species: 'dog', ageGroup: 'adult', energy: 'calm' })).toEqual([]);
  });
  it('warns about a mismatch without pretending to approve an adoption', () => {
    const notes = compatibilityNotes(pets.find(p => p.id === 'taiga')!, { ...DEMO_DRAFT, children: 'yes', otherPets: 'cat', away: '8+' });
    expect(notes).toHaveLength(5);
    expect(notes.join(' ')).toContain('Квартира');
  });
});
describe('Application validation', () => {
  it('requires a complete household step', () => {
    expect(Object.keys(validateStep(EMPTY_DRAFT, 0))).toHaveLength(5);
    expect(validateStep(DEMO_DRAFT, 0)).toEqual({});
  });
  it('rejects whitespace-only text and invalid contact syntax', () => {
    expect(Object.keys(validateStep({ ...DEMO_DRAFT, name: ' ', email: 'wrong@', motivation: ' '.repeat(24) }, 1))).toEqual(['name', 'email', 'motivation']);
    expect(validateStep(DEMO_DRAFT, 1)).toEqual({});
  });
  it('requires explicit demo and care acknowledgements', () => {
    expect(Object.keys(validateStep(DEMO_DRAFT, 2))).toHaveLength(2);
    expect(validateStep({ ...DEMO_DRAFT, careAccepted: true, demoAccepted: true }, 2)).toEqual({});
  });
});
describe('Local persistence boundaries', () => {
  const ids = pets.map(p => p.id);
  it('recovers from corrupted favorite storage and removes unknown IDs', () => {
    expect(parseFavoriteIds('{broken', ids)).toEqual([]);
    expect(parseFavoriteIds('["bim", "bim", "missing", 42]', ids)).toEqual(['bim']);
  });
  it('discards invalid receipts and never restores contact fields', () => {
    const valid = { id: 'DEMO-12345678', petId: 'bim', createdAt: '2026-09-30T08:00:00.000Z', email: 'private@example.test', name: 'Private', motivation: 'private text' };
    expect(parseReceipts(JSON.stringify([valid, valid, { ...valid, id: 'wrong' }, { ...valid, petId: 'missing' }]), ids)).toEqual([{ id: valid.id, petId: valid.petId, createdAt: valid.createdAt }]);
    expect(parseReceipts('null', ids)).toEqual([]);
  });
  it('limits retained history to thirty receipts', () => {
    const receipts = Array.from({ length: 40 }, (_, i) => ({ id: 'DEMO-' + String(i).padStart(8, '0'), petId: 'bim', createdAt: '2026-09-30T08:00:00Z' }));
    expect(parseReceipts(JSON.stringify(receipts), ids)).toHaveLength(30);
  });
});
