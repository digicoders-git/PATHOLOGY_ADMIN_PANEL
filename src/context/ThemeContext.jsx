import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('currentTheme') || 'mono'
  })

  useEffect(() => {
    localStorage.setItem('currentTheme', currentTheme)
  }, [currentTheme])

  const themes = {
    mono: {
      dark: {
        background: '#000000',
        sidebar: '#1A1A1A',
        primary: '#FFFFFF',
        accent: '#6B7280', 
        warning: '#FACC15',
        text: '#FFFFFF',
        textSecondary: '#9CA3AF'
      },
      light: {
        background: '#FFFFFF',
        sidebar: '#F8FAFC',
        primary: '#000000',
        accent: '#374151', 
        warning: '#F59E0B',
        text: '#000000',
        textSecondary: '#6B7280'
      }
    },
    cyan: {
      dark: {
        background: '#0F172A',
        sidebar: '#1E293B',
        primary: '#0EA5E9',
        accent: '#38BDF8', 
        warning: '#FACC15',
        text: '#FFFFFF',
        textSecondary: '#94A3B8'
      },
      light: {
        background: '#FFFFFF',
        sidebar: '#F0F9FF',
        primary: '#0EA5E9',
        accent: '#0284C7', 
        warning: '#EAB308',
        text: '#0F172A',
        textSecondary: '#64748B'
      }
    },
    neon: {
      dark: {
        background: '#020617',
        sidebar: '#0F172A',
        primary: '#22C55E',
        // accent: '#A855F7', 
        accent: '#22C55E', 
        warning: '#FACC15',
        text: '#FFFFFF',
        textSecondary: '#94A3B8'
      },
      light: {
        background: '#FFFFFF',
        sidebar: '#F8FAFC',
        primary: '#22C55E',
        // accent: '#A855F7', 
        accent: '#22C55E', 
        warning: '#FACC15',
        text: '#1E293B',
        textSecondary: '#64748B'
      }
    },
    warm: {
      dark: {
        background: '#1C1917',
        sidebar: '#292524',
        primary: '#EA580C',
        accent: '#FB923C', 
        warning: '#FACC15',
        text: '#FEF3E2',
        textSecondary: '#D4A574'
      },
      light: {
        background: '#FFF7ED',
        sidebar: '#FEFCFB',
        surface: '#FFFFFF',
        primary: '#C2410C',
        accent: '#F97316', 
        warning: '#FACC15',
        text: '#431407',
        textSecondary: '#92400E'
      }
    }
  }

  const theme = {
    colors: themes[currentTheme][isDarkMode ? 'dark' : 'light'],
    isDarkMode,
    currentTheme,
    themes,
    toggleTheme: () => setIsDarkMode(!isDarkMode),
    setTheme: (themeName) => setCurrentTheme(themeName)
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}