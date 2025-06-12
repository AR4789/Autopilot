import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "./AuthContext"; // adjust path if needed


const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const { setIsLoggedIn } = useContext(AuthContext); // Add this if not already
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const BASE_URL = process.env.REACT_APP_API_URL;





    const validateEmail = (email) => /^[A-Z][a-zA-Z0-9]*@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/.test(email);
    const validatePassword = (password) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateEmail(email)) return setError("Invalid email format. First letter must be capital.");
        if (!validatePassword(password)) return setError("Password must be 8+ chars with uppercase, number & symbol.");

        setError("");
        setLoading(true);
        try {
            const res = await axios.post(`${BASE_URL}/api/auth/login`, {
                email,
                password,
            });

            const { token } = res.data;
            login(token);
            toast.success("Login successful!");
            setTimeout(() => navigate("/"), 1500);
        } catch (err) {
            const msg = err?.response?.data?.message || "Login failed. Check your credentials.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleSuccess = async (credentialResponse) => {
        const idToken = credentialResponse.credential;
        try {
            const res = await axios.post(`${BASE_URL}/api/auth/login/google`,
                { idToken },
                { withCredentials: true } // 🔥 Important: to accept Set-Cookie
            );

            // Optional: still store the token if you want
            // login(res.data.token); 

            // ✅ Call /auth/status to update login state
            const statusRes = await fetch(`${BASE_URL}/api/auth/status`, {
                credentials: "include",
            });
            const statusData = await statusRes.json();

            console.log(statusData);

            if (statusData.isLoggedIn) {
                setIsLoggedIn(true);
                toast.success("Google login successful!");
                setTimeout(() => navigate("/"), 1500);
            } else {
                toast.error("Auth check failed after login.");
            }

        } catch (err) {
            const message = err.response?.data?.message || "Google login failed.";
            toast.error(message);
        }
    };


const handleForgotPassword = async () => {
    if (!resetEmail) return toast.error("Please enter your email.");

    try {
        await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email: resetEmail });

        toast.success("Password reset link sent. Check your email.", {
            onClose: () => {
                setShowReset(false);
                setResetEmail("");
            }
        });
    } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to send reset link.");
    }
};




    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl mb-4 text-black font-bold text-center">Login</h2>
                <ToastContainer position="top-center" />
                {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border rounded w-full p-2"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border rounded w-full p-2"
                        required
                    />
                    <p className="text-sm mt-1 text-blue-500 underline cursor-pointer" onClick={() => setShowReset(true)}>
                        Forgot Password?
                    </p>
                </div>
                <button
                    type="submit"
                    className={`w-full bg-yellow-400 text-black rounded px-4 py-2 ${loading && "opacity-50"}`}
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p className="mt-4 text-center">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="text-blue-500 underline"
                    >
                        Register
                    </button>
                </p>

                <div className="mt-6  justify-center">
                    <GoogleOAuthProvider clientId="257209872073-c64mrb08nn0r4d0uj3h239l63t73q8h1.apps.googleusercontent.com">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error("Google Login Failed")}
                        />
                    </GoogleOAuthProvider>
                </div>
            </form>
            {showReset && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Reset Password</h3>
                        <input
                            type="email"
                            placeholder="Enter your registered email"
                            className="border rounded w-full p-2 mb-4"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowReset(false)}
                                className="px-4 py-2 bg-gray-400 text-white rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleForgotPassword}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Send Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer position="top-center" 
            autoClose={1500}/>


        </div>
    );
};

export default LoginPage;
