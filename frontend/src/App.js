import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AutomationPage from "./components/AutomationPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import { AuthProvider } from "./components/AuthContext"; // ✅ make sure this is correct path
import { ThemeProvider } from "./components/ThemeContext";
import ProfilePage from "./components/ProfilePage";
import ResetPasswordPage from "./components/ResetPassword";

const App = () => {
  return (
      <AuthProvider> {/* ✅ wrap here */}
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<AutomationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<ProfilePage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </Router>
      </AuthProvider>
  );
};

export default App;
