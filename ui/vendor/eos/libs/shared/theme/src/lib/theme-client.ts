import { Theme } from 'remix-themes';

export function getInitialThemeFromDom(): Theme | null {
  if (document.documentElement.classList.contains('dark')) {
    return Theme.DARK;
  }

  if (document.documentElement.classList.contains('light')) {
    return Theme.LIGHT;
  }

  return null;
}
