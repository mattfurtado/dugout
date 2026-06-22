import { useAuthStore } from '../store/authStore';
import { useStore } from '../store';

export function useTheme() {
  const { user } = useAuthStore();
  const { theme, saveTheme } = useStore();
  const isLight = theme === 'light';

  const toggle = () => {
    const next = isLight ? 'dark' : 'light';
    if (next === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', next);
    if (user) saveTheme(next, user.id);
    else useStore.setState({ theme: next });
  };

  return { isLight, toggle };
}
