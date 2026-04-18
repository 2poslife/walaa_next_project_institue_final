import type { EducationLevel } from '@/types';

const PLACEHOLDER = { value: '', label: 'اختر الصف' };

/**
 * Class (grade) options for the student form, based on education level name.
 */
export function getStudentClassSelectOptions(
  level: EducationLevel | null | undefined
): { value: string; label: string }[] {
  const levelName = (level?.name_ar || level?.name_en || '').toLowerCase();

  if (!levelName) {
    return [PLACEHOLDER];
  }

  if (levelName.includes('ابتد')) {
    return [
      PLACEHOLDER,
      { value: 'أول', label: 'أول' },
      { value: 'ثاني', label: 'ثاني' },
      { value: 'ثالث', label: 'ثالث' },
      { value: 'رابع', label: 'رابع' },
      { value: 'خامس', label: 'خامس' },
      { value: 'سادس', label: 'سادس' },
    ];
  }

  if (levelName.includes('اعداد') || levelName.includes('إعداد')) {
    return [
      PLACEHOLDER,
      { value: 'سابع', label: 'سابع' },
      { value: 'ثامن', label: 'ثامن' },
      { value: 'تاسع', label: 'تاسع' },
    ];
  }

  if (levelName.includes('ثانو') || levelName.includes('ثان')) {
    return [
      PLACEHOLDER,
      { value: 'عاشر', label: 'عاشر' },
      { value: 'حادي عشر', label: 'حادي عشر' },
      { value: 'ثاني عشر', label: 'ثاني عشر' },
    ];
  }

  if (levelName.includes('جامع')) {
    return [
      PLACEHOLDER,
      { value: 'جامعي', label: 'جامعي' },
      { value: 'ما بعد الثانوي', label: 'ما بعد الثانوي' },
    ];
  }

  return [PLACEHOLDER];
}
