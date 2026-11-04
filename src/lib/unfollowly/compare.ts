export interface Comparison {
  lost: string[];
  gained: string[];
  unchanged: string[];
  oldCount: number;
  newCount: number;
}

export function compareSnapshots(older: string[], newer: string[]): Comparison {
  const oldSet = new Set(older);
  const newSet = new Set(newer);
  return {
    lost: older.filter((n) => !newSet.has(n)),
    gained: newer.filter((n) => !oldSet.has(n)),
    unchanged: newer.filter((n) => oldSet.has(n)),
    oldCount: older.length,
    newCount: newer.length,
  };
}
