// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const BASE_URL = process.env.REACT_APP_API_URL;


   useEffect(() => {
    const checkAuth = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/auth/status`, {
                credentials: "include",
            });
            const data = await res.json();
            console.log("Dtataaaaaaaaa------- ", data);
            setIsLoggedIn(data.isLoggedIn);
        } catch (err) {
            setIsLoggedIn(false);
        }
    };

    checkAuth();
}, []);



   const logout = async () => {
    try {
        await fetch(`${BASE_URL}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
    } catch (e) {
        console.error("Logout failed on server:", e);
    }

    setIsLoggedIn(false);
};


    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
