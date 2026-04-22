import { EducationLevel } from '@/types';

const BUSTAN_FALLBACK: EducationLevel = {
  id: 8,
  name_ar: 'بستان',
  name_en: 'Bustan',
};

export function withBustanFallback(levels: EducationLevel[]): EducationLevel[] {
  const list = Array.isArray(levels) ? [...levels] : [];

  const hasBustan = list.some(
    (level) =>
      level.id === BUSTAN_FALLBACK.id ||
      level.name_ar === BUSTAN_FALLBACK.name_ar ||
      level.name_en?.toLowerCase() === BUSTAN_FALLBACK.name_en.toLowerCase()
  );

  if (!hasBustan) {
    list.push(BUSTAN_FALLBACK);
  }

  return list.sort((a, b) => a.id - b.id);
}
