import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('farmMonitor_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'light';
  });
  const [loading, setLoading] = useState(false);

  const toggleTheme = useCallback(async () => {
    setLoading(true);
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      
      // Update local state and localStorage immediately
      setTheme(newTheme);
      localStorage.setItem('farmMonitor_theme', newTheme);
      
      // Update DOM class
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error updating theme preference:', error);
    } finally {
      setLoading(false);
    }
  }, [theme]);

  // Apply theme to DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};