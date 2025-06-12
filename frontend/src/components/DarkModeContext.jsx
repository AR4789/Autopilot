import React, { createContext, useContext, useEffect, useState } from 'react';

const DarkModeContext = createContext();
export const useDarkMode = () => useContext(DarkModeContext);

export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);

    // Apply dark mode class to body or html
    if (darkMode) {
      document.documentElement.classList.add('dark');  // Tailwind uses this
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
