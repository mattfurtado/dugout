import { useState } from 'react';

export function useTheme() {
  const [isLight, setIsLight] = useState(
    document.documentElement.classList.contains('light')
  );

  const toggle = () => {
    const html = document.documentElement;
    if (html.classList.contains('light')) {
      html.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setIsLight(false);
    } else {
      html.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsLight(true);
    }
  };

  return { isLight, toggle };
}
