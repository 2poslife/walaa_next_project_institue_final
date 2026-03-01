/**
 * Lesson submission deadline: teachers can add lessons for a given month
 * only until a set day of the following month (inclusive or not).
 * Config comes from app_settings (admin dashboard) or env vars as fallback.
 */

export type LessonDeadlineConfig = {
  deadlineDay: number;
  deadlineInclusive: boolean;
};

function envDeadlineDay(): number {
  const v = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LESSON_SUBMISSION_DEADLINE_DAY;
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 31 ? n : 2;
}

function envDeadlineInclusive(): boolean {
  return (typeof process !== 'undefined' && process.env?.LESSON_SUBMISSION_DEADLINE_INCLUSIVE) !== 'false';
}

/** Resolve day from config or env. For UI: pass from settings when available. */
export function getDeadlineDay(config?: LessonDeadlineConfig | null): number {
  if (config != null && Number.isFinite(config.deadlineDay) && config.deadlineDay >= 1 && config.deadlineDay <= 31) {
    return config.deadlineDay;
  }
  return envDeadlineDay();
}

/** Resolve inclusive from config or env. */
export function isDeadlineInclusive(config?: LessonDeadlineConfig | null): boolean {
  if (config != null && typeof config.deadlineInclusive === 'boolean') return config.deadlineInclusive;
  return envDeadlineInclusive();
}

/** Day of next month used as deadline (1 = 1st, 2 = 2nd). For UI display when no config. */
export const LESSON_SUBMISSION_DEADLINE_DAY = typeof process !== 'undefined' ? envDeadlineDay() : 2;

/**
 * Returns the deadline date (YYYY-MM-DD) for a lesson — e.g. "2023-02-15" → "2023-03-02".
 */
export function getSubmissionDeadlineForLessonDate(lessonDate: string, config?: LessonDeadlineConfig | null): string {
  const [y, m] = lessonDate.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return '';
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const day = String(getDeadlineDay(config)).padStart(2, '0');
  const month = String(nextMonth).padStart(2, '0');
  return `${nextYear}-${month}-${day}`;
}

/**
 * Checks if a lesson with the given date can still be submitted today.
 * Uses config from app_settings when provided (e.g. from API); otherwise env.
 * @param lessonDate - YYYY-MM-DD
 * @param referenceDate - defaults to now (local)
 * @param config - from admin settings (deadlineDay, deadlineInclusive); optional
 */
export function isLessonDateWithinSubmissionWindow(
  lessonDate: string,
  referenceDate: Date = new Date(),
  config?: LessonDeadlineConfig | null
): boolean {
  const deadline = getSubmissionDeadlineForLessonDate(lessonDate, config);
  if (!deadline) return false;
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const [dy, dm, dd] = deadline.split('-').map(Number);
  const deadlineDate = new Date(dy, dm - 1, dd);
  const inclusive = isDeadlineInclusive(config);
  return inclusive ? ref.getTime() <= deadlineDate.getTime() : ref.getTime() < deadlineDate.getTime();
}

/** Build user-facing message (Arabic) for current config. */
export function getLessonSubmissionDeadlineMessage(config?: LessonDeadlineConfig | null): string {
  const day = getDeadlineDay(config);
  const inclusive = isDeadlineInclusive(config);
  const dayLabel = day === 1 ? 'الأول' : day === 2 ? 'الثاني' : `${day}`;
  if (inclusive) {
    return `انتهى الموعد لإضافة دروس لهذا الشهر. يمكن إضافة الدروس حتى اليوم ${dayLabel} من الشهر التالي فقط.`;
  }
  return `انتهى الموعد لإضافة دروس لهذا الشهر. يمكن إضافة الدروس حتى آخر يوم من شهر الدرس فقط (اليوم ${dayLabel} من الشهر التالي غير مشمول).`;
}

/** Legacy export: message using env only (for server when config not yet fetched). */
export const LESSON_SUBMISSION_DEADLINE_MESSAGE = typeof process !== 'undefined' ? getLessonSubmissionDeadlineMessage() : 'انتهى الموعد لإضافة دروس لهذا الشهر.';

/** Build LessonDeadlineConfig from app_settings rows (key, value) or from a flat object. */
export function getLessonDeadlineConfigFromSettings(settings: { key: string; value: string }[] | Record<string, unknown>): LessonDeadlineConfig {
  const get = (k: string): string | boolean | undefined => {
    if (Array.isArray(settings)) {
      const row = settings.find((r) => r.key === k);
      return row?.value;
    }
    const v = (settings as Record<string, unknown>)[k];
    if (typeof v === 'boolean') return v;
    return v != null ? String(v) : undefined;
  };
  const dayRaw = get('lesson_submission_deadline_day');
  const day = typeof dayRaw === 'string' ? parseInt(dayRaw, 10) : 2;
  const inclusiveRaw = get('lesson_submission_deadline_inclusive');
  const inclusive = inclusiveRaw === true || inclusiveRaw === 'true';
  return {
    deadlineDay: Number.isFinite(day) && day >= 1 && day <= 31 ? day : 2,
    deadlineInclusive: inclusive,
  };
}
