// src/pages/ResetPasswordPage.jsx
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const BASE_URL = process.env.REACT_APP_API_URL;


  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword: password,
      });
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reset failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form onSubmit={handleReset} className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-white">Reset Password</h2>
        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          type="submit"
          onClick={handleReset}
          className="w-full bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Reset Password
        </button>
      </form>
      <ToastContainer  position="top-center"/>
    </div>
  );
};

export default ResetPasswordPage;
