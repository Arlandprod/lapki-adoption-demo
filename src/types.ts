export type Species = 'dog' | 'cat';
export type Compatibility = 'yes' | 'no' | 'unknown';
export type Housing = 'apartment' | 'house';
export type Energy = 'calm' | 'moderate' | 'active';
export type AgeGroup = 'young' | 'adult' | 'senior';
export interface PhotoCredit {
  file: string; species: Species; description: string; author: string;
  sourcePageUrl: string; originalImageUrl: string; licenseName: string; licenseUrl: string;
  changes: string; suggestedObjectPosition: string;
}
export interface Pet {
  id: string; name: string; species: Species; sex: 'female' | 'male'; age: string; ageGroup: AgeGroup;
  size: string; energy: Energy; apartment: boolean; children: Compatibility; cats: Compatibility;
  dogs: Compatibility; firstTime: boolean; specialCare: boolean; aloneHours: string;
  headline: string; story: string; routine: string; care: string; considerations: string; tags: string[]; photo: PhotoCredit;
}
export interface Filters {
  species: 'all' | Species; housing: 'any' | Housing; children: boolean; otherPets: 'any' | Species;
  energy: 'any' | Energy; ageGroup: 'any' | AgeGroup; firstTime: boolean; specialCare: boolean;
}
export interface ApplicationDraft {
  housing: '' | Housing; children: '' | 'yes' | 'no'; otherPets: '' | 'none' | Species;
  experience: '' | 'first' | 'experienced'; away: '' | '0-4' | '4-8' | '8+';
  name: string; email: string; motivation: string; careAccepted: boolean; demoAccepted: boolean;
}
export interface Receipt { id: string; petId: string; createdAt: string; }
export type DraftErrors = Partial<Record<keyof ApplicationDraft, string>>;
