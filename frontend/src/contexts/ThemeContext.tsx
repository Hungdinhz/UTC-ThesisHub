import React, { createContext, useContext, useEffect, type ReactNode } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Khóa cố định chế độ sáng (Light Mode) chuẩn nhận diện UTC
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.removeItem('pms-theme');
  }, []);

  const toggleTheme = () => {
    // Chế độ tối đã được vô hiệu hóa theo yêu cầu
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
