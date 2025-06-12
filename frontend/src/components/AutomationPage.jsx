import React, { useState, useRef } from "react";
import ConfigForm from "./ConfigForm";
import axios from "axios";
import { FaMoon, FaSun } from "react-icons/fa";
import RunwayAnimation from "./RunwayAnimation";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SubscriptionContext } from "./SubscriptionContext";



function AutomationPage() {
  const [config, setConfig] = useState({ pre: [], post: [] });
  const [result, setResult] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flightStatus, setFlightStatus] = useState("idle"); // "idle", "takingOff", "crashed"
  const [statusMessage, setStatusMessage] = useState("Ready for takeoff ✈️");
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState("basic"); // Default mode
  const configFormRef = useRef();
  const takeoffAudioRef = useRef(null);
  const resultRef = useRef(null);
const BASE_URL = process.env.REACT_APP_API_URL;








  const playSound = async (type) => {
    if (muted) return;

    const audio = new Audio(type === "crash" ? "/crash.mp3" : "/takeoff.mp3");
    audio.volume = 0.6;

    if (type === "takeoff") {
      takeoffAudioRef.current = audio;
    }

    try {
      await audio.play();
    } catch (err) {
      console.error("Audio playback failed:", err);
    }
  };

  const subscription = {
  plan: "basic", // or "premium"
  maxTasks: 5,   // limit for basic
};


  const handleRunAutomation = () => {

    setLoading(true);
    // Put your automation logic here or call your API, etc.
    console.log("Automation started with config:", config);
    // Simulate async operation
    setTimeout(() => {
      setLoading(false);
      //     alert("Automation completed!");
    }, 2000);
  };




  const handleSubmit = async () => {
    const isValid = await configFormRef.current.validateAndRun();

    if (!isValid) return;

    setFlightStatus("takingOff");
    setStatusMessage("🛫 Taking off...");
    await playSound("takeoff");

    setLoading(true);
    setResult("");

    try {
      // Check for shell tasks
   

      let requestPayload;

      if (mode === "basic") {
        const allTasks = [...config.pre, ...config.post];
        requestPayload = { basic: allTasks };
      } else {
        requestPayload = config;
      }

      const response = await axios.post(`${BASE_URL}/api/auth/run-config`, requestPayload);

      const responseText = response.data;

      // 🚨 Check if the response includes signs of failure
      const crashIndicators = ["❌", "exception", "error", "failed"];
      const isCrash = crashIndicators.some((word) =>
        responseText.toLowerCase().includes(word.toLowerCase())
      );

      if (isCrash) {
        setResult(responseText);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
        throw new Error("Detected crash indicators in response.");
      }

      console.log("✅ Response received:", responseText);
      setResult(responseText);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);

      setTimeout(() => {
        setFlightStatus("idle");
        setStatusMessage("✅ Ready for takeoff ✈️");
        setLoading(false);
      }, 2500);

    } catch (err) {
      console.error("🔥 Crash due to error or bad response:", err);
      // Stop takeoff sound immediately if playing
      if (takeoffAudioRef.current) {
        takeoffAudioRef.current.pause();
        takeoffAudioRef.current.currentTime = 0;
      }

      setFlightStatus("crashed");
      setStatusMessage("💥 Crash landing!");
      playSound("crash");

      setTimeout(() => {
        setFlightStatus("idle");
        setStatusMessage("🧯 Ready for takeoff ✈️");
        setLoading(false);
      }, 5000);
    }
  };







  const backgroundSvg = darkMode
    ? "none"
    : `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' viewBox='0 0 1600 900' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23cceeff'%3E%3Cpath d='M0 180 C 400 280 1200 80 1600 180 L1600 0 L0 0 Z'/%3E%3Cpath d='M0 320 C 500 420 1100 220 1600 320 L1600 0 L0 0 Z' opacity='0.6'/%3E%3Cpath d='M0 480 C 600 580 1000 380 1600 480 L1600 0 L0 0 Z' opacity='0.3'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div
        className="min-h-screen p-6 bg-blue-100 dark:bg-gray-900 transition-colors"
        style={{
          backgroundImage: backgroundSvg,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
        }}
      >


        <div
          className={`absolute top-0 left-0 w-full h-64 z-0 animate-clouds ${darkMode ? "opacity-10" : "opacity-30"
            }`}
          style={{
            backgroundImage: `url("/clouds.png")`,
            backgroundRepeat: "repeat-x",
            backgroundSize: "contain"
          }}
        ></div>

        <div className="max-w-4xl mx-auto bg-transparent dark:transparent shadow-xl rounded-xl p-8 backdrop-blur-md transition-colors">
          {/* Header */}
          {/* Header with Dark Mode Toggle */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">🚀 Autopilot</h1>
              <p className="text-gray-600 dark:text-gray-600 text-lg">An Automation Config Tool</p>
            </div>
            <div className="text-right">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="text-2xl text-gray-800 dark:text-gray-100"
                title="Toggle Dark Mode"
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </button>
            </div>
          </div>


          {/* Runway + Plane */}
          <div className="sticky top-0 z-10 bg-transparent">
            <RunwayAnimation
              taskCount={config.pre.length + config.post.length}
              status={flightStatus}
              muted={muted}
              setMuted={setMuted}
              statusMessage={statusMessage}
            />
          </div>


          {/* Config Form */}
          <SubscriptionContext.Provider value={subscription}>
          <ConfigForm
            ref={configFormRef}
            config={config}
            setConfig={setConfig}
            mode={mode}
            setMode={setMode}
            onRunAutomation={handleRunAutomation}
          />
          </SubscriptionContext.Provider>


          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow transition dark:text-white"
            >
              {loading ? "Launching..." : "🚀 Launch Automation"}
            </button>
          </div>

          {/* Output */}
          {loading && (
            <div className="text-center mt-4 animate-pulse text-blue-400">
              ⏳ Executing, please wait...
            </div>
          )}

          {result && (
            <div
              ref={resultRef}
              className="mt-8 bg-gray-900 text-white rounded-lg p-4 whitespace-pre-wrap dark:text-white"            >
              <h3 className="text-lg font-semibold mb-2 text-green-400">
                Execution Output
              </h3>
              <pre className="overflow-x-auto">{result}</pre>
            </div>
          )}

        </div>
      </div>
              <ToastContainer 
           position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        />
    </div>
  );
}

export default AutomationPage;
