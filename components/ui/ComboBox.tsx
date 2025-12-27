import { useState, useMemo, useEffect, useRef } from 'react';

interface ComboBoxOption {
  value: string | number;
  label: string;
}

interface ComboBoxProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: ComboBoxOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  noMatchesMessage?: string;
}

export function ComboBox({
  label,
  value,
  onChange,
  options,
  placeholder = 'ابحث واختَر',
  required,
  disabled,
  noMatchesMessage = 'لا توجد نتائج',
}: ComboBoxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(lower)
    );
  }, [query, options]);

  useEffect(() => {
    const match = options.find((option) => String(option.value) === String(value));
    if (match) {
      setQuery(match.label);
    } else if (!value) {
      setQuery('');
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {label && (
        <label className="block text-lg font-medium text-gray-900 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange text-gray-900 text-lg"
          disabled={disabled}
          required={required && !value}
        />
        {open && !disabled && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-gray-900">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-base text-gray-500">{noMatchesMessage}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`w-full text-right px-3 py-2 text-lg hover:bg-gray-100 ${
                    String(option.value) === String(value)
                      ? 'bg-gray-50 font-semibold'
                      : 'bg-white'
                  }`}
                  onClick={() => {
                    onChange(String(option.value));
                    setQuery(option.label);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}


