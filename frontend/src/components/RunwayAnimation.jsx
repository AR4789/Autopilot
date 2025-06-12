import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlaneDeparture, FaVolumeMute, FaVolumeUp, FaPlane } from "react-icons/fa";

const RunwayAnimation = ({ taskCount, status, muted, setMuted, statusMessage }) => {
  const baseX = 0;
  const rollX = Math.min(taskCount * 40, 500);
  const launchX = 600;

  const getIdleOrTakeoffAnimation = () => {
    if (status === "takingOff") {
      return {
        x: launchX,
        y: -300,
        opacity: 0,
        transition: { duration: 2, ease: "easeInOut" },
      };
    } else {
      return {
        x: rollX,
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 60 },
      };
    }
  };

  return (
    <div className="relative h-40 bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl my-6 overflow-hidden border border-gray-400 dark:border-gray-600">

      {/* Status Text */}
      <div className="text-center text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
        {statusMessage}
      </div>

      {/* Runway Lines */}
      <div className="absolute inset-x-0 bottom-8 h-1 bg-white dark:bg-gray-300 w-full"></div>
      <div className="absolute inset-x-0 bottom-6 h-1 bg-white dark:bg-gray-300 w-full"></div>

      {/* Plane Animation */}
      <AnimatePresence>
        {status === "crashed" ? (
          <>
            {/* Left Half */}
            <motion.div
              key="crash-left"
              initial={{ x: 300, y: -200, rotate: 0, opacity: 1 }}
              animate={{
                x: 260,
                y: 60,
                rotate: -45,
                opacity: 1,
                transition: { duration: 2, ease: "easeInOut" },
              }}
              exit={{ opacity: 0 }}
              className="absolute text-4xl text-red-500 dark:text-red-400"
              style={{ bottom: 0, left: 0 }}
            >
              <FaPlane style={{ clipPath: "inset(0 50% 0 0)" }} />
            </motion.div>

            {/* Right Half */}
            <motion.div
              key="crash-right"
              initial={{ x: 300, y: -200, rotate: 0, opacity: 1 }}
              animate={{
                x: 340,
                y: 60,
                rotate: 45,
                opacity: 1,
                transition: { duration: 2, ease: "easeInOut" },
              }}
              exit={{ opacity: 0 }}
              className="absolute text-4xl text-red-500 dark:text-red-400"
              style={{ bottom: 0, left: 0 }}
            >
              <FaPlane style={{ clipPath: "inset(0 0 0 50%)" }} />
            </motion.div>
          </>
        ) : (
          <motion.div
            key="plane"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={getIdleOrTakeoffAnimation()}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-0 text-4xl text-blue-500 dark:text-blue-400"
          >
            <FaPlaneDeparture />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute Button */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute top-2 right-2 text-2xl p-2 rounded-full bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700 transition"
        aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      >
        {muted ? <FaVolumeMute className="text-gray-700 dark:text-gray-200" /> : <FaVolumeUp className="text-gray-700 dark:text-gray-200" />}
      </button>
    </div>
  );
};

export default RunwayAnimation;
