import React, { useState, useEffect, createContext } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        // Load from localStorage or default to false
        const storedMode = localStorage.getItem("darkMode");
        return storedMode === "true"; // string to boolean
    });

    const [subscription, setSubscription] = useState("free");

    useEffect(() => {
        // Apply the "dark" class to the root element
        document.documentElement.classList.toggle("dark", darkMode);
        // Save preference to localStorage
        localStorage.setItem("darkMode", darkMode);
    }, [darkMode]);

    return (
        <ThemeContext.Provider value={{ darkMode, setDarkMode, subscription, setSubscription }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
