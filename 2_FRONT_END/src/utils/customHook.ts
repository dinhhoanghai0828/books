import { useEffect, useState } from 'react';

// Tra ve true khi component da mount xong phia client.
// Dung de tranh loi hydration cua Next.js khi render phia server va client khac nhau.
export const useHasMounted = (): boolean => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
};
