import { useEffect, useState } from 'react';

// Hook debounce de delay thuc thi mot function
// Dung de tranh goi API qua nhieu khi nguoi dung nhap nhanh
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
