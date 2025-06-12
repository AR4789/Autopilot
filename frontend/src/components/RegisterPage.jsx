import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "", username: "", email: "", password: "", confirmPassword: ""
    });
    const [error, setError] = useState("");
    const BASE_URL = process.env.REACT_APP_API_URL;


    const validateEmail = (email) => /^[A-Z][a-zA-Z0-9]*@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/.test(email);
    const validatePassword = (password) =>
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

const handleRegister = async (e) => {
    e.preventDefault();
    const { name, username, email, password, confirmPassword } = form;

    if (!validateEmail(email)) return setError("Email must start with a capital letter.");
    if (!validatePassword(password)) return setError("Password must contain uppercase, lowercase, number, special char, and be 8+ chars.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    try {
        await axios.post(`${BASE_URL}/api/auth/register`, {
            name, username, email, password
        }, { withCredentials: true }); // 👈 important for sending cookies

        toast.success("Registered and logged in!");
        setTimeout(() => navigate("/"), 2000);
    } catch (err) {
        setError(err.response?.data?.message || "Registration failed. Try again.");
    }
};



 const handleGoogleSuccess = async (credentialResponse) => {
    try {
        const res = await axios.post(`${BASE_URL}/api/auth/google`, {
            idToken: credentialResponse.credential
        }, { withCredentials: true }); // 🔐 Needed to accept the cookie

        const data = res.data;

        if (data.alreadyRegistered) {
            toast.info("User already registered. Logging you in...");
            setTimeout(() => navigate("/login"), 2000);
        } else {
            toast.success("Registered with Google and logged in!");
            setTimeout(() => navigate("/"), 2000);
        }


    } catch (err) {
        toast.error("Google login failed.");
    }
};



    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl mb-4 font-semibold text-center">Register</h2>
                {error && <p className="text-red-500 mb-2">{error}</p>}
                {["name", "username", "email", "password", "confirmPassword"].map((field) => (
                    <div className="mb-4" key={field}>
                        <label className="block mb-1 capitalize">{field}</label>
                        <input
                            type={field.includes("password") ? "password" : "text"}
                            name={field}
                            value={form[field]}
                            onChange={handleChange}
                            required
                            className="border rounded w-full p-2"
                        />
                    </div>
                ))}
                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded">
                    Register
                </button>

                 <p className="mt-4 text-center">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-blue-500 underline"
                    >
                        Login
                    </button>
                </p>

                <div className="my-4 text-center text-sm">or</div>

                <GoogleOAuthProvider clientId="257209872073-c64mrb08nn0r4d0uj3h239l63t73q8h1.apps.googleusercontent.com">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error("Google login failed")}
                    />
                </GoogleOAuthProvider>
            </form>
            <ToastContainer position="top-center"
                    autoClose={1500}
/>
        </div>
    );
};

export default RegisterPage;
