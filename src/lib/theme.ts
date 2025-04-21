import { SystemConfig } from './config';

export function applyTheme(config: SystemConfig) {
  const root = document.documentElement;
  const html = document.querySelector('html');

  // Aplicar tema claro/escuro
  if (config.appearance.theme === 'system') {
    html?.classList.remove('light', 'dark');
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      html?.classList.add('dark');
    } else {
      html?.classList.add('light');
    }
  } else {
    html?.classList.remove('light', 'dark');
    html?.classList.add(config.appearance.theme);
  }

  // Aplicar densidade do layout
  root.style.setProperty('--layout-density', config.appearance.density);
  document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
  document.body.classList.add(`density-${config.appearance.density}`);

  // Aplicar tamanho da fonte
  const fontSizeMap = {
    small: '0.875',
    medium: '1',
    large: '1.125'
  };
  root.style.setProperty('--font-size-multiplier', fontSizeMap[config.appearance.fontSize]);

  // Aplicar cor de destaque
  root.style.setProperty('--accent-color', config.appearance.accentColor);
  root.style.setProperty('--accent-foreground', getContrastColor(config.appearance.accentColor));
}

// Função auxiliar para determinar a cor do texto baseada no contraste
function getContrastColor(hexcolor: string) {
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
} 