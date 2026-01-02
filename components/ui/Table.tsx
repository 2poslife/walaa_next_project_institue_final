import React from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T, index?: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6 shadow-lg">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200/60 shadow-xl bg-white" dir="rtl">
      <table className="min-w-full divide-y divide-gray-200/60">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 via-orange-50/30 to-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-4 text-right text-sm font-bold text-gray-700 min-w-[120px] tracking-wide uppercase border-b-2 border-orange-200/50"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100/50">
          {data.map((item, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(item)}
              className={`
                transition-all duration-300 ease-in-out
                ${onRowClick ? 'cursor-pointer' : ''}
                ${index % 2 === 0 ? 'bg-gradient-to-r from-orange-50/40 to-orange-50/20' : 'bg-gradient-to-r from-blue-50/40 to-blue-50/20'}
                hover:bg-gradient-to-r hover:from-orange-100/60 hover:via-white hover:to-orange-100/60
                hover:shadow-md hover:scale-[1.01]
                border-l-4 border-transparent hover:border-orange-400
              `}
            >
              {columns.map((column) => (
                <td 
                  key={column.key} 
                  className="px-6 py-4 text-sm text-gray-800 min-w-[120px] font-medium whitespace-nowrap"
                >
                  {column.render ? column.render(item, index) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
