import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_PACKS, DEFAULT_THEME_PACK, getThemePack } from '../theme/themePacks';

const ThemePackContext = createContext({
  themePackId: DEFAULT_THEME_PACK,
  themePack: THEME_PACKS[DEFAULT_THEME_PACK],
  setThemePackId: () => {},
  updateThemePack: async () => {}
});

export function ThemePackProvider({ children, initialTheme = DEFAULT_THEME_PACK, parentToken }) {
  const [themePackId, setThemePackIdState] = useState(() => {
    const saved = localStorage.getItem('cq_theme_pack');
    return saved && THEME_PACKS[saved] ? saved : initialTheme;
  });

  useEffect(() => {
    if (initialTheme && THEME_PACKS[initialTheme] && initialTheme !== themePackId) {
      setThemePackIdState(initialTheme);
      localStorage.setItem('cq_theme_pack', initialTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTheme]);

  const setThemePackId = (newThemeId) => {
    if (THEME_PACKS[newThemeId]) {
      setThemePackIdState(newThemeId);
      localStorage.setItem('cq_theme_pack', newThemeId);
    }
  };

  const updateThemePack = async (newThemeId) => {
    if (!THEME_PACKS[newThemeId]) return false;
    setThemePackId(newThemeId);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (parentToken) {
        headers['x-parent-token'] = parentToken;
      }
      const res = await fetch('/api/household/theme', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ theme_pack: newThemeId })
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to update household theme on server:', err);
      return false;
    }
  };

  const themePack = getThemePack(themePackId);

  return (
    <ThemePackContext.Provider
      value={{
        themePackId,
        themePack,
        setThemePackId,
        updateThemePack
      }}
    >
      {children}
    </ThemePackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemePack() {
  const context = useContext(ThemePackContext);
  if (!context) {
    return {
      themePackId: DEFAULT_THEME_PACK,
      themePack: THEME_PACKS[DEFAULT_THEME_PACK],
      setThemePackId: () => {},
      updateThemePack: async () => false
    };
  }
  return context;
}
