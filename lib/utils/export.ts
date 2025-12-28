/**
 * Export utilities for CSV generation
 */

export interface LessonExportRow {
  type: string; // 'individual' | 'group' | 'remedial'
  date: string;
  student: string;
  education_level?: string;
  hours: number;
  approved: string; // 'نعم' | 'لا'
  total_cost?: number;
}

/**
 * Convert lessons data to CSV format
 */
export function convertToCSV(data: LessonExportRow[]): string {
  const headers = ['النوع', 'التاريخ', 'الطالب', 'المستوى التعليمي', 'الساعات', 'معتمد'];
  const rows = data.map((row) => [
    row.type,
    row.date,
    row.student,
    row.education_level || '',
    row.hours.toString(),
    row.approved,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Add BOM for UTF-8 to ensure Excel displays Arabic correctly
  return '\uFEFF' + csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(data: LessonExportRow[], filename: string) {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for filename
 */
export function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
