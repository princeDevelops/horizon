const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    const sortedEntries = entries
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, val]) => [key, normalize(val)]);

    return Object.fromEntries(sortedEntries);
  }

  return value;
};

const toStableString = (value: unknown): string =>
  JSON.stringify(normalize(value));

export const cacheKeys = {
  authMe: (userId: string) => `auth:me:${userId}`,
  taskListPrefix: (userId: string) => `tasks:list:${userId}:`,

  taskList: (userId: string, filters: unknown) =>
    `tasks:list:${userId}:${toStableString(filters)}`,
};
