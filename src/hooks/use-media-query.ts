import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Atualiza o estado inicial
    setMatches(media.matches);

    // Define o listener para mudanças
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Adiciona o listener
    media.addEventListener('change', listener);

    // Cleanup
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
} 