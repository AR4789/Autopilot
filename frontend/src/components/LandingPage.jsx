import React, { useState, useEffect, useContext } from "react";
import { motion, useAnimation } from "framer-motion";
import { FaPlaneDeparture, FaVolumeMute, FaVolumeUp, FaChevronDown } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "./AuthContext";
import { ThemeContext } from "./ThemeContext";
import axios from "axios";


const LandingPage = () => {
    const navigate = useNavigate();
    const [takeoff, setTakeoff] = useState(false);
    const [muted, setMuted] = useState(false);
    const { darkMode, setDarkMode, setSubscription } = useContext(ThemeContext);
    const { isLoggedIn, logout } = useContext(AuthContext);
    const controls = useAnimation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const BASE_URL = process.env.REACT_APP_API_URL;


    useEffect(() => {
        controls.start({
            opacity: 1,
            y: 0,
            transition: { duration: 1.2, ease: "easeOut" },
        });

        const timer = setTimeout(() => {
            setTakeoff(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, [muted, controls]);

    const toggleMute = () => setMuted((prev) => !prev);

    const handleSubscribe = async (tier) => {
        try {
            console.log("Checking authentication status...");
            const res = await axios.get(`${BASE_URL}/api/auth/status`, {
                withCredentials: true
            });
            console.log("Authentication status response:", res.data);

            // If successful, proceed
            await initiateRazorpay(tier);
        } catch (err) {
            console.error("Error checking authentication status:", err);
            // If not authenticated, redirect to login
            navigate("/login");
        }
    };



    const initiateRazorpay = async (tier) => {
        const res = await loadRazorpayScript();

        if (!res) {
            alert("Razorpay SDK failed to load. Are you online?");
            return;
        }

        const response = await fetch(`${BASE_URL}/api/payment/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ plan: tier }),
        });

        const data = await response.json();

        if (!data || !data.orderId) {
            alert(data.message || "Failed to create order");
            return;
        }

        const options = {
            key: "YOUR_RAZORPAY_KEY_ID",
            amount: data.amount,
            currency: data.currency || "INR",
            name: "Autopilot",
            description: `${tier} plan subscription`,
            order_id: data.orderId,
            handler: function (response) {
                alert("Payment successful!");
                setSubscription(tier);
                navigate("/app");
            },
            prefill: {
                email: data.prefill_email || "",
                contact: data.prefill_contact || "",
            },
            theme: {
                color: "#FBBF24",
            },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

        paymentObject.on("payment.failed", function (response) {
            alert("Payment failed: " + response.error.description);
        });
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className={`relative min-h-screen overflow-hidden text-white bg-gradient-to-br 
      ${darkMode ? "from-gray-900 to-gray-800" : "from-sky-300 to-indigo-600"}
      transition-colors duration-1000`}
        >
            {/* Dark Mode Toggle */}
            <div className="absolute top-6 right-6 flex items-center space-x-4 z-50">
                <button onClick={toggleMute} className="p-2 rounded-full bg-yellow-400 dark:bg-yellow-300 text-black dark:text-gray-900 shadow hover:bg-yellow-300 transition" aria-label={muted ? "Unmute sound" : "Mute sound"}>
                    {muted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                </button>

                <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-1 rounded bg-yellow-400 dark:bg-yellow-300 text-black dark:text-gray-900 font-semibold shadow hover:bg-yellow-300 transition">
                    {darkMode ? "Light Mode" : "Dark Mode"}
                </button>

                <a href="#plans" onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
                }} className="px-3 py-1 rounded bg-yellow-400 dark:bg-yellow-300 text-black dark:text-gray-900 font-semibold shadow hover:bg-yellow-300 transition">
                    Subscriptions
                </a>

                {isLoggedIn ? (
                    <>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center px-3 py-1 rounded bg-yellow-400 dark:bg-yellow-300 text-black dark:text-gray-900 font-semibold shadow hover:bg-yellow-300 transition"
                        >
                            Profile
                            <svg
                                className={`ml-2 w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : "rotate-0"
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            navigate("/account");
                                        }}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                        My Account
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <button onClick={() => navigate("/login")} className="px-3 py-1 rounded bg-yellow-400 dark:bg-yellow-300 text-black dark:text-gray-900 font-semibold shadow hover:bg-yellow-300 transition">
                        Login
                    </button>
                )}
            </div>

            {/* Title & Subtitle */}
            <motion.div className="text-center pt-24 px-4" initial={{ opacity: 0, y: 20 }} animate={controls}>
                <h1 className="text-5xl font-bold tracking-wide drop-shadow-lg">
                    🚀 Welcome to <span className="text-yellow-300">Autopilot</span>
                </h1>
                <p className="text-xl mt-4 text-white/90 dark:text-gray-300">
                    Add your task, Configure details, launch it.
                </p>
                <p className="mt-2 text-sm italic text-white/70 dark:text-gray-400">
                    Automate with precision, launch with confidence.
                </p>
            </motion.div>

            {/* Runway */}
            <div className="absolute top-[460px] left-0 w-full h-1 bg-white dark:bg-gray-400 shadow-md" />
            <div className="absolute top-[480px] left-0 w-full h-1 bg-white dark:bg-gray-400 shadow-md" />

            {/* Plane Animation */}
            <motion.div initial={{ x: 0, y: 0, rotate: 0, filter: "drop-shadow(0 0 3px rgba(255, 255, 150, 0.8))" }} animate={takeoff ? {
                x: 1000,
                y: -300,
                rotate: 30,
                filter: [
                    "drop-shadow(0 0 3px rgba(255, 255, 150, 0.8))",
                    "drop-shadow(0 0 20px rgba(255, 255, 100, 1))",
                ],
                transition: { duration: 2, ease: "easeInOut" },
            } : {
                x: [0, 200, 400, 600, 800],
                filter: "drop-shadow(0 0 3px rgba(255, 255, 150, 0.8))",
                transition: { duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
            }} className="absolute top-[422px] left-0 text-6xl text-white drop-shadow-lg">
                <FaPlaneDeparture />
            </motion.div>

            {/* Cloud animations */}
            <motion.div initial={{ x: "-20%" }} animate={{ x: "120%" }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-10 left-0 w-40 h-20 bg-white/40 rounded-full blur-2xl" />
            <motion.div initial={{ x: "100%" }} animate={{ x: "-30%" }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute top-32 right-0 w-32 h-16 bg-white/30 rounded-full blur-xl" />
            <motion.div initial={{ x: "-10%" }} animate={{ x: "110%" }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute top-20 right-20 w-28 h-14 bg-white/25 rounded-full blur-xl" />
            <motion.div initial={{ x: "110%" }} animate={{ x: "-15%" }} transition={{ duration: 100, repeat: Infinity, ease: "linear" }} className="absolute top-48 left-10 w-36 h-18 bg-white/35 rounded-full blur-2xl" />

            {/* Scroll down indicator */}
            <motion.div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 dark:text-gray-400" animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                <FaChevronDown size={28} />
            </motion.div>

            {/* CTA Button */}
            <div className="text-center mt-16">
                <motion.button onClick={() => {
                    setTakeoff(true);
                    if (!muted) {
                        const audio = new Audio("/takeoff.mp3");
                        audio.play().catch((err) => console.warn("Playback blocked:", err));
                    }
                    setTimeout(() => {
                        window.location.href = "/app";
                    }, 1500);
                }} className="inline-block mt-12 px-8 py-3 bg-yellow-400 text-black font-semibold rounded-full shadow-lg hover:bg-yellow-300 transition dark:text-gray-900" whileHover={{ scale: 1.05 }}>
                    Get Started
                </motion.button>
            </div>

            {/* About Section */}
            <section className="mt-32 px-6 text-center max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-yellow-300 mb-4">About Autopilot</h2>
                <p className="text-lg text-white/90 dark:text-gray-300">
                    Autopilot is your automation co-pilot. Whether you're launching scripts, APIs, or server tasks,
                    our platform ensures reliable execution with visual feedback, dark mode, and sound integration.
                </p>
            </section>

            {/* Features Section */}
            <section className="mt-24 px-6 text-center max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-yellow-300 mb-6">Key Features</h2>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left text-white/90 dark:text-gray-300">
                    <li className="bg-white/10 p-6 rounded-xl shadow-lg">✅ Automated Task Execution</li>
                    <li className="bg-white/10 p-6 rounded-xl shadow-lg">✅ Configurable Task Modes</li>
                    <li className="bg-white/10 p-6 rounded-xl shadow-lg">✅ Subscription Models</li>
                    <li className="bg-white/10 p-6 rounded-xl shadow-lg">✅ Sound Effects</li>
                    <li className="bg-white/10 p-6 rounded-xl shadow-lg">✅ Responsive UI</li>
                    <li className="bg-white/10 p-6 rounded-xl shadow-lg">✅ Launch From Anywhere, Anytime</li>
                </ul>
            </section>

            {/* Contact Section */}
            <section className="mt-24 px-6 text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-yellow-300 mb-4">Contact Us</h2>
                <p className="text-white/90 dark:text-gray-300 mb-2">
                    Have questions or feedback? We'd love to hear from you!
                </p>
                <p className="text-white/70 dark:text-gray-400">
                    Email: <a href="mailto:support@autopilot.com" className="underline">support@autopilot.com</a>
                </p>
            </section>

            {/* Subscription Plans */}
            <section id="plans" className="mt-24 px-6 text-center max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-yellow-300 mb-6">Subscription Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/90 dark:text-gray-300">
                    {/* Free Plan */}
                    <div className="bg-white/10 p-6 rounded-xl shadow-lg border border-yellow-300">
                        <h3 className="text-2xl font-bold mb-2">Free</h3>
                        <p className="text-yellow-300 text-lg font-semibold mb-4">₹0 / month</p>
                        <ul className="text-left space-y-2">
                            <li>✅ Basic Mode Only</li>
                            <li>✅ Up to 5 Tasks at a Time</li>
                            <li>❌ No Advanced Mode</li>
                            <li>❌ Priority Support</li>
                        </ul>
                        <button className="mt-6 px-5 py-2 bg-yellow-400 text-black rounded-full font-semibold hover:bg-yellow-300 transition" onClick={() => navigate("/app")}>
                            Get Started
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div className="relative bg-yellow-300 dark:bg-yellow-400 p-6 rounded-xl shadow-2xl transform scale-105">
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 text-sm rounded-full font-bold shadow">
                            Best Value
                        </span>
                        <h3 className="text-2xl font-bold text-black mb-2">Premium</h3>
                        <p className="text-black text-lg font-semibold mb-4">₹700 / month</p>
                        <ul className="text-left text-black space-y-2">
                            <li>✅ Basic & Advanced Modes</li>
                            <li>✅ 30 Basic Tasks</li>
                            <li>✅ 25 Advanced Tasks</li>
                            <li>✅ Standard Support</li>
                        </ul>
                        <button className="mt-6 px-5 py-2 bg-black text-yellow-300 rounded-full font-semibold hover:bg-gray-800 transition" onClick={() => handleSubscribe('premium')}>
                            Subscribe
                        </button>
                    </div>

                    {/* Business Plan */}
                    <div className="bg-white/10 p-6 rounded-xl shadow-lg border border-yellow-300">
                        <h3 className="text-2xl font-bold mb-2">Business</h3>
                        <p className="text-yellow-300 text-lg font-semibold mb-4">₹1500 / month</p>
                        <ul className="text-left space-y-2">
                            <li>✅ Basic & Advanced Modes</li>
                            <li>✅ 50 Basic Tasks</li>
                            <li>✅ 50 Advanced Tasks</li>
                            <li>✅ Enterprise Support</li>
                            <li>✅ Customization on Demand</li>
                        </ul>
                        <button className="mt-6 px-5 py-2 bg-yellow-400 text-black rounded-full font-semibold hover:bg-yellow-300 transition" onClick={() => handleSubscribe('business')}>
                            Contact Sales
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-32 py-6 border-t border-white/20 text-center text-white/60 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} Autopilot. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;
