// src/pages/PMODashboard.jsx

import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faBullhorn,
  faUserPlus,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const PMOPanel = () => {
  const navigate = useNavigate();

  // ======================================================
  // Check Admin/PMO Session
  // ======================================================

  useEffect(() => {
    const pmoAuth = localStorage.getItem("pmoAuth");

    if (pmoAuth !== "true") {
      navigate("/pmologin", { replace: true });
    }
  }, [navigate]);

  // ======================================================
  // Logout
  // ======================================================

  const handleLogout = () => {
    // Admin session sirf manual logout par remove hogi
    localStorage.removeItem("pmoAuth");

    // Logout ke baad Main Role Selection screen
    navigate("/main", { replace: true });
  };

  // ======================================================
  // Navigation
  // ======================================================

  const handleNavigate = (path) => {
    navigate(path);
  };

  // ======================================================
  // Animation Variants
  // ======================================================

  const containerVariants = {
    hidden: {
      opacity: 0
    },

    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      y: 30,
      opacity: 0
    },

    visible: {
      y: 0,
      opacity: 1
    }
  };

  // ======================================================
  // Dashboard Items
  // ======================================================
  // IMPORTANT:
  // Main Page option intentionally removed.
  // Admin ko dashboard se MainRoles par jane ka option
  // nahi milega.
  // ======================================================

  const dashboardItems = [
    {
      icon: faUserPlus,
      label: "Add User",
      route: "/pmoadduser",
      color: "#00ff9d",
      desc: "Register new Students or Supervisors"
    },

    {
      icon: faBullhorn,
      label: "Announcements",
      route: "/pmonoti",
      color: "#ff9900",
      desc: "Broadcast notifications to everyone"
    }
  ];

  // ======================================================
  // UI
  // ======================================================

  return (
    <div
      className="d-flex flex-column min-vh-100 position-relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily:
          "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#fff"
      }}
    >

      {/* ==================================================
          Background Animated Orb 1
      ================================================== */}

      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "500px",
          height: "500px",
          background: "#303f9f",
          filter: "blur(180px)",
          top: "-20%",
          left: "-10%",
          opacity: 0.3,
          zIndex: 0
        }}
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 30, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 15
        }}
      />

      {/* ==================================================
          Background Animated Orb 2
      ================================================== */}

      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "400px",
          height: "400px",
          background: "#ff00cc",
          filter: "blur(150px)",
          bottom: "-10%",
          right: "-10%",
          opacity: 0.15,
          zIndex: 0
        }}
        animate={{
          scale: [1, 1.2, 1],
          y: [0, -40, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 10
        }}
      />

      {/* ==================================================
          Navbar
      ================================================== */}

      <motion.header
        className="py-3 px-4 shadow-lg d-flex justify-content-between align-items-center"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderBottom:
            "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 10
        }}
        initial={{
          y: -50,
          opacity: 0
        }}
        animate={{
          y: 0,
          opacity: 1
        }}
      >

        <h3 className="m-0 fw-bold d-flex align-items-center text-white">

          <div
            className="d-flex align-items-center justify-content-center rounded-circle me-3"
            style={{
              width: "45px",
              height: "45px",
              background: "rgba(255,255,255,0.1)"
            }}
          >
            <FontAwesomeIcon
              icon={faUserTie}
              className="text-info"
            />
          </div>

          Admin
          <span className="fw-light ms-2 opacity-75">
            Dashboard
          </span>

        </h3>

        {/* ==================================================
            Logout Button
        ================================================== */}

        <button
          className="btn btn-outline-warning btn-sm rounded-pill px-3"
          onClick={handleLogout}
        >
          Logout
        </button>

      </motion.header>

      {/* ==================================================
          Main Content
      ================================================== */}

      <main
        className="flex-grow-1 container py-5 d-flex flex-column justify-content-center position-relative"
        style={{
          zIndex: 5
        }}
      >

        <motion.div
          className="text-center mb-5"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.2
          }}
        >

          <h2 className="fw-bold display-5">
            Admin Dashboard
          </h2>

          <p className="text-white-50 fs-5">
            Select a task to proceed
          </p>

        </motion.div>

        {/* ==================================================
            Dashboard Cards
        ================================================== */}

        <motion.div
          className="row g-4 justify-content-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {dashboardItems.map((item, idx) => (

            <div
              className="col-md-6 col-lg-4"
              key={idx}
            >

              <motion.div
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  boxShadow:
                    `0 0 30px ${item.color}60`,
                  borderColor:
                    item.color
                }}
                whileTap={{
                  scale: 0.98
                }}
                onClick={() =>
                  handleNavigate(item.route)
                }
                className="card h-100 p-4 border-0 text-start text-white position-relative overflow-hidden"
                style={{
                  background:
                    "rgba(255, 255, 255, 0.05)",
                  backdropFilter:
                    "blur(15px)",
                  border:
                    "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "20px",
                  cursor: "pointer"
                }}
              >

                {/* Colored Glow Bar */}

                <div
                  className="position-absolute top-0 start-0 w-100"
                  style={{
                    height: "4px",
                    background: item.color
                  }}
                />

                <div className="d-flex align-items-center justify-content-between mb-3">

                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "60px",
                      height: "60px",
                      background:
                        `${item.color}20`,
                      color:
                        item.color
                    }}
                  >

                    <FontAwesomeIcon
                      icon={item.icon}
                      size="lg"
                    />

                  </div>

                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-white-50"
                  />

                </div>

                <h4 className="fw-bold mb-2">
                  {item.label}
                </h4>

                <p className="small text-white-50 mb-0">
                  {item.desc}
                </p>

              </motion.div>

            </div>

          ))}

        </motion.div>

      </main>

      {/* ==================================================
          Footer
      ================================================== */}

      <motion.footer
        className="text-white text-center py-3"
        style={{
          background:
            "rgba(0,0,0,0.2)",
          backdropFilter:
            "blur(5px)",
          borderTop:
            "1px solid rgba(255, 255, 255, 0.05)"
        }}
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        transition={{
          delay: 1
        }}
      >

        <small className="opacity-50">
          © 2026 Smart Classeoom - Admin Panel
        </small>

      </motion.footer>

    </div>
  );
};

export default PMOPanel;

