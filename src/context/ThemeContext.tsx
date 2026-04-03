import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { theme as antdTheme, type ThemeConfig } from 'antd';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  switchMode: (mode: ThemeMode) => void;
  themeConfig: ThemeConfig;
}

const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#D94F3D',
    colorBgBase: '#FAF7F5',
    colorBgLayout: '#FAF7F5',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorText: '#1A1210',
    colorTextSecondary: '#5C4A47',
    colorTextHeading: '#1A1210',
    colorLink: '#D94F3D',
    colorLinkHover: '#E8724A',
    colorLinkActive: '#C0392B',
    colorError: '#C0392B',
    colorWarning: '#B8620A',
    colorSuccess: '#2D7A4F',
    colorInfo: '#2E6DA4',
    colorBorder: '#E0D6D3',
    colorBorderSecondary: '#EDE7E4',
    colorFillContent: '#F2EDEA',
    borderRadius: 8,
    fontFamily: "'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    boxShadow: '0 4px 24px rgba(26, 18, 16, 0.06)',
    boxShadowSecondary: '0 8px 32px rgba(26, 18, 16, 0.08)',
  },
  components: {
    Card: {
      borderRadiusLG: 12,
      colorBgContainer: '#FFFFFF',
    },
    Button: {
      borderRadius: 8,
      fontWeight: 600,
      primaryShadow: '0 4px 16px rgba(217, 79, 61, 0.2)',
    },
    Input: {
      colorBgContainer: '#F2EDEA',
      colorBorder: '#EDE7E4',
      borderRadius: 8,
      activeBorderColor: 'rgba(217, 79, 61, 0.4)',
      hoverBorderColor: 'rgba(217, 79, 61, 0.2)',
    },
    Select: {
      colorBgContainer: '#F2EDEA',
      colorBorder: '#EDE7E4',
      optionSelectedBg: '#FBEAE7',
    },
    Table: {
      headerBg: '#F2EDEA',
      headerColor: '#5C4A47',
      rowHoverBg: '#FBEAE7',
    },
    Tag: { borderRadiusSM: 6 },
    Alert: { borderRadiusLG: 8 },
  },
};

const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#D94F3D',
    colorBgBase: '#0C0A0A',
    colorBgLayout: '#0C0A0A',
    colorBgContainer: '#1A1110',
    colorBgElevated: '#1A1614',
    colorText: '#F5F0EF',
    colorTextSecondary: '#7A6665',
    colorTextHeading: '#F5F0EF',
    colorLink: '#E8724A',
    colorLinkHover: '#FBEAE7',
    colorLinkActive: '#D94F3D',
    colorError: '#C0392B',
    colorWarning: '#B8620A',
    colorSuccess: '#2D7A4F',
    colorInfo: '#2E6DA4',
    colorBorder: '#2A1F1E',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',
    colorFillContent: '#1A1110',
    borderRadius: 8,
    fontFamily: "'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  components: {
    Card: {
      borderRadiusLG: 12,
      colorBgContainer: 'rgba(255, 255, 255, 0.04)',
    },
    Button: {
      borderRadius: 8,
      fontWeight: 600,
      primaryShadow: '0 4px 16px rgba(217, 79, 61, 0.3)',
    },
    Input: {
      colorBgContainer: '#120E0D',
      colorBorder: '#2A1F1E',
      borderRadius: 8,
      activeBorderColor: 'rgba(217, 79, 61, 0.5)',
      hoverBorderColor: 'rgba(217, 79, 61, 0.3)',
    },
    Select: {
      colorBgContainer: '#120E0D',
      colorBorder: '#2A1F1E',
      optionSelectedBg: 'rgba(217, 79, 61, 0.15)',
      colorBgElevated: '#1A1614',
    },
    Table: {
      headerBg: '#120E0D',
      headerColor: '#7A6665',
      colorBgContainer: 'rgba(255, 255, 255, 0.02)',
      rowHoverBg: 'rgba(217, 79, 61, 0.08)',
    },
    Tag: { borderRadiusSM: 6 },
    Alert: { borderRadiusLG: 8 },
    Modal: {
      contentBg: '#1A1110',
      headerBg: '#1A1110',
    },
  },
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function getInitialMode(): ThemeMode {
  try {
    const saved = localStorage.getItem('megax-theme-mode');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* ignored */ }
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialMode);

  const applyBodyClass = useCallback((mode: ThemeMode) => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const switchMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    applyBodyClass(mode);
    try { localStorage.setItem('megax-theme-mode', mode); } catch { /* ignored */ }
  }, [applyBodyClass]);

  useEffect(() => {
    applyBodyClass(themeMode);
  }, []);

  const themeConfig = useMemo(() => themeMode === 'dark' ? darkTheme : lightTheme, [themeMode]);

  const value = useMemo(() => ({ themeMode, switchMode, themeConfig }), [themeMode, switchMode, themeConfig]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
