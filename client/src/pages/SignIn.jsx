import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Sparkles, Zap } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  const [loadingPhase, setLoadingPhase] = useState("welcome"); // 'welcome' | 'loading'

  useEffect(() => {
    // 1. Show Welcome Screen for 4 seconds
    const timer1 = setTimeout(() => {
      setLoadingPhase("loading");
    }, 2000);

    // 2. Simulate Loading for 3.5 seconds, then Navigate
    const timer2 = setTimeout(() => {
      navigate("/main");
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [navigate]);

  return (
    <div
      className="vh-100 d-flex flex-column justify-content-center align-items-center position-relative overflow-hidden"
      style={{
        background: "radial-gradient(circle at center, #1a1a2e 0%, #0f0c29 100%)",
        fontFamily: "'Segoe UI', sans-serif",
        color: "#fff",
      }}
    >
      {/* ================= BACKGROUND ANIMATIONS ================= */}
      <BackgroundOrbs />

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="z-2 position-relative container d-flex justify-content-center align-items-center h-100">
        <AnimatePresence mode="wait">
          
          {/* --- PHASE 1: WELCOME SCREEN --- */}
          {loadingPhase === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center p-5 rounded-5"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                maxWidth: "600px",
              }}
            >
              {/* Floating Icon */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="mb-4 d-inline-block position-relative"
              >
                <div className="position-absolute top-50 start-50 translate-middle" 
                     style={{ width: 100, height: 100, background: "#00d4ff", filter: "blur(40px)", opacity: 0.5 }}></div>
                <Rocket size={80} color="#00d4ff" style={{ filter: "drop-shadow(0 0 15px #00d4ff)" }} />
              </motion.div>

              <motion.h1
                className="display-3 fw-bold mb-3 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Smart <span style={{ color: "transparent", backgroundClip: "text", backgroundImage: "linear-gradient(to right, #00d4ff, #00ff9d)" }}>ClassRoom</span>
              </motion.h1>

              <motion.p
                className="lead text-white-50 mb-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                The Future of Education Management
              </motion.p>
            </motion.div>
          )}

          {/* --- PHASE 2: LOADING SCREEN --- */}
          {loadingPhase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="text-center w-100"
              style={{ maxWidth: "500px" }}
            >
              <motion.div 
                className="mb-4"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Zap size={60} color="#00ff9d" fill="#00ff9d" />
              </motion.div>

              <h2 className="fw-bold mb-4" style={{ letterSpacing: "2px" }}>INITIALIZING...</h2>

              {/* Custom Neon Progress Bar */}
              <div className="position-relative rounded-pill overflow-hidden" 
                   style={{ height: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <motion.div
                  className="h-100 rounded-pill"
                  style={{
                    background: "linear-gradient(90deg, #00d4ff, #00ff9d)",
                    boxShadow: "0 0 20px #00d4ff",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>

              <motion.div 
                className="mt-3 d-flex justify-content-between text-white-50 small font-monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span>Loading Assets</span>
                <span>Connecting to Server</span>
                <span>Ready</span>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Skip Button (Optional UX improvement) */}
      <motion.button
        className="position-absolute bottom-0 end-0 m-4 btn btn-sm text-white-50 border-0"
        style={{ zIndex: 10, background: "rgba(0,0,0,0.3)" }}
        whileHover={{ color: "#fff", scale: 1.05 }}
        onClick={() => navigate("/main")}
      >
        Skip Intro <Sparkles size={12} className="ms-1"/>
      </motion.button>
    </div>
  );
}

// --- Sub-component for Background Effects ---
const BackgroundOrbs = () => (
  <>
    <motion.div
      className="position-absolute rounded-circle"
      style={{
        width: "60vw", height: "60vw",
        background: "radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, rgba(0,0,0,0) 70%)",
        top: "-20%", left: "-10%", zIndex: 0,
      }}
      animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
    />
    <motion.div
      className="position-absolute rounded-circle"
      style={{
        width: "50vw", height: "50vw",
        background: "radial-gradient(circle, rgba(255, 0, 204, 0.1) 0%, rgba(0,0,0,0) 70%)",
        bottom: "-10%", right: "-10%", zIndex: 0,
      }}
      animate={{ x: [0, -40, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
    />
    {/* Grid Overlay for texture */}
    <div 
        className="position-absolute w-100 h-100" 
        style={{ 
            backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            opacity: 0.3,
            zIndex: 0
        }} 
    />
  </>
);