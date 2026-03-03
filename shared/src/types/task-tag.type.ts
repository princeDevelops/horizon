/** Predefined task tags available in the system. */
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

/** Internal object type used to derive tag unions. */
type TagObject = typeof TAG;
/** Key union of `TAG`. */
type TagKeys = keyof TagObject;
/** Value union of allowed task tag literals. */
export type Tag = TagObject[TagKeys];
