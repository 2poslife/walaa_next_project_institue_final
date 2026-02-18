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
  deleted?: string; // 'نعم' | 'لا'
  deletion_note?: string;
}

/**
 * Convert lessons data to CSV format
 */
export function convertToCSV(data: LessonExportRow[]): string {
  const headers = ['النوع', 'التاريخ', 'الطالب', 'المستوى التعليمي', 'الساعات', 'معتمد', 'محذوف', 'ملاحظة الحذف'];
  const rows = data.map((row) => [
    row.type,
    row.date,
    row.student,
    row.education_level || '',
    row.hours.toString(),
    row.approved,
    row.deleted ?? '',
    row.deletion_note ?? '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Add BOM for UTF-8 to ensure Excel displays Arabic correctly
  return '\uFEFF' + csvContent;
}

/**
 * Download CSV file (lessons only)
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

export interface StudentSummaryRow {
  studentName: string;
  individualLessons: number;
  individualHours: number;
  groupLessons: number;
  groupHours: number;
  remedialLessons: number;
  remedialHours: number;
}

/**
 * Build CSV content for student summary (no BOM)
 */
export function summaryToCSVSection(rows: StudentSummaryRow[], formatHours: (n: number) => string): string {
  const headers = ['الطالب', 'دروس فردية', 'ساعات فردية', 'دروس جماعية', 'ساعات جماعية', 'הוראה מתקנת', 'ساعات הוראה מתקנת', 'إجمالي الساعات'];
  const dataRows = rows.map((row) => [
    row.studentName,
    row.individualLessons.toString(),
    formatHours(row.individualHours),
    row.groupLessons.toString(),
    formatHours(row.groupHours),
    row.remedialLessons.toString(),
    formatHours(row.remedialHours),
    formatHours(row.individualHours + row.groupHours + row.remedialHours),
  ]);
  return [
    headers.join(','),
    ...dataRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}

/**
 * Download CSV with lesson rows and a student summary at the end
 */
export function downloadCSVWithSummary(
  lessonData: LessonExportRow[],
  summaryRows: StudentSummaryRow[],
  filename: string,
  formatHours: (n: number) => string
) {
  const lessonCSV = convertToCSV(lessonData);
  const summarySection = summaryToCSVSection(summaryRows, formatHours);
  const fullContent = lessonCSV + '\n\nملخص الطلاب\n' + summarySection;
  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
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
