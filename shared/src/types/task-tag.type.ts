export const TAG = {
  WORK: 'work',
  PERSONAL: 'personal',
  URGENT: 'urgent',
  HOME: 'home',
  SHOPPING: 'shopping',
  HEALTH: 'health',
  FINANCE: 'finance',
  LEARNING: 'learning',
} as const;

type TagObject = typeof TAG;
type TagKeys = keyof TagObject;
export type Tag = TagObject[TagKeys];
