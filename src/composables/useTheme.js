

import { ref, watch, onMounted, onUnmounted } from 'vue';

import { THEME_CONFIG } from '@/utils/baseConfig';



export function useTheme() {

  const theme = ref(THEME_CONFIG.defaultTheme);

  

  const toggleTheme = () => {

    theme.value = theme.value === 'light' ? 'dark' : 'light';

    localStorage.setItem('theme', theme.value);

    applyTheme(theme.value);

  };

  

  const applyTheme = (selectedTheme) => {

    const root = document.documentElement;

    const themeVars = THEME_CONFIG[selectedTheme];

    // 根据当前主题选择对应的主题色
    const currentColor = selectedTheme === 'dark' 
        ? window.EZ_CONFIG.DEFAULT_CONFIG.darkColor 
        : window.EZ_CONFIG.DEFAULT_CONFIG.primaryColor;

    if (selectedTheme === 'dark') {

      document.body.classList.add('dark-theme');

    } else {

      document.body.classList.remove('dark-theme');

    }

    

    document.body.offsetHeight;

    

    root.style.setProperty('--theme-color', currentColor);

    root.style.setProperty('--theme-color-rgb', hexToRgb(currentColor));

    

    root.style.setProperty('--theme-hover-color', adjustColorBrightness(currentColor, -10));

    root.style.setProperty('--primary-color-hover', adjustColorBrightness(currentColor, -10));

    

    root.style.setProperty('--background-color', themeVars.backgroundColor);

    root.style.setProperty('--card-background', themeVars.cardBackground);

    root.style.setProperty('--text-color', themeVars.textColor);

    root.style.setProperty('--secondary-text-color', themeVars.secondaryTextColor);

    root.style.setProperty('--border-color', themeVars.borderColor);

    root.style.setProperty('--shadow-color', themeVars.shadowColor);

    

    if (selectedTheme === 'dark') {

      document.querySelectorAll('.auth-card').forEach(card => {

        card.style.backgroundColor = '#1e1e1e';

        card.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)';

      });

    } else {

      document.querySelectorAll('.auth-card').forEach(card => {

        card.style.backgroundColor = '';

        card.style.boxShadow = '';

      });

    }

  };


  // 添加辅助函数用于转换颜色
  function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result 
          ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
          : null;
  }

  function adjustColorBrightness(hex, percent) {
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);

      r = Math.max(0, Math.min(255, r + (r * percent / 100)));
      g = Math.max(0, Math.min(255, g + (g * percent / 100)));
      b = Math.max(0, Math.min(255, b + (b * percent / 100)));

      const rr = Math.round(r).toString(16).padStart(2, '0');
      const gg = Math.round(g).toString(16).padStart(2, '0');
      const bb = Math.round(b).toString(16).padStart(2, '0');

      return `#${rr}${gg}${bb}`;
  }

  

  const initTheme = () => {

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {

      theme.value = savedTheme;

    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {

      theme.value = 'dark';

    }

    

    if (document.readyState === 'loading') {

      document.addEventListener('DOMContentLoaded', () => {

        applyTheme(theme.value);

      });

    } else {

      applyTheme(theme.value);

    }

  };

  

  watch(theme, (newTheme) => {

    applyTheme(newTheme);

  });

  

  const handleSystemThemeChange = (e) => {

    if (!localStorage.getItem('theme')) {

      theme.value = e.matches ? 'dark' : 'light';

    }

  };

  

  onMounted(() => {

    initTheme();

    

    if (window.matchMedia) {

      const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

      colorSchemeQuery.addEventListener('change', handleSystemThemeChange);

    }

  });

  

  onUnmounted(() => {

    if (window.matchMedia) {

      const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

      colorSchemeQuery.removeEventListener('change', handleSystemThemeChange);

    }

  });

  

  return {

    theme,

    toggleTheme,

    applyTheme

  };

} 
