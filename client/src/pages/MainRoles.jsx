import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faUserGraduate,
  faChalkboardTeacher,
  faCogs,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const MainRoles = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } },
  };

  // --- Configuration for Roles ---
  const roles = [
    {
      id: 1,
      title: "Student",
      path: "/studentlogin",
      icon: faUserGraduate,
      color: "#00d4ff", // Neon Cyan
      desc: "Access your dashboard and submit assignments.",
    },
    {
      id: 2,
      title: "Instructor",
      path: "/supervisorlogin",
      icon: faChalkboardTeacher,
      color: "#ff00cc", // Neon Pink
      desc: "Manage courses and grade students.",
    },
    {
      id: 3,
      title: "Administrator",
      path: "/pmologin",
      icon: faCogs,
      color: "#00ff9d", // Neon Green
      desc: "System configurations and user management.",
    },
  ];

  return (
    <div
      className="d-flex flex-column min-vh-100 position-relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        color: "#fff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* --- Header --- */}
      <motion.header
        className="py-3 px-4 d-flex justify-content-between align-items-center shadow-lg"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 10,
        }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h3 className="m-0 fw-bold d-flex align-items-center text-white">
          <motion.span
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 1.2, type: "spring" }}
            className="me-2 text-warning"
          >
            <FontAwesomeIcon icon={faGraduationCap} size="lg" />
          </motion.span>
          Smart <span className="text-info mx-1">Class</span>Room
        </h3>

        {/* Top Nav Buttons (Hidden on small screens for cleaner look) */}
        <div className="d-none d-md-flex gap-2">
          {roles.map((role) => (
            <motion.button
              key={role.id}
              className="btn text-white btn-sm"
              style={{
                border: `1px solid ${role.color}`,
                boxShadow: `0 0 5px ${role.color}40`,
              }}
              whileHover={{
                scale: 1.05,
                backgroundColor: role.color,
                color: "#000",
                boxShadow: `0 0 15px ${role.color}`,
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate(role.path)}
            >
              <FontAwesomeIcon icon={role.icon} className="me-2" />
              {role.title}
            </motion.button>
          ))}
        </div>
      </motion.header>

      {/* --- Main Content --- */}
      <main className="flex-grow-1 d-flex flex-column justify-content-center align-items-center position-relative px-3">
        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-5 z-2"
        >
          <h1 className="display-4 fw-bold mb-2 text-white">
            Welcome to <span style={{ color: "#00d4ff" }}>Smart ClassRoom</span>
          </h1>
          <p className="lead text-light opacity-75">
            Where Smartness Meets Education.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ zIndex: 5 }}
        >
          <div className="row justify-content-center g-4">
            {roles.map((role) => (
              <div key={role.id} className="col-md-4 col-lg-3">
                <motion.div
                  variants={cardVariants}
                  whileHover={{
                    y: -10,
                    boxShadow: `0 0 25px ${role.color}`,
                    borderColor: role.color,
                  }}
                  className="card h-100 text-center p-4 border-0"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "20px",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                  onClick={() => handleNavigate(role.path)}
                >
                  {/* Icon with Neon Glow Background */}
                  <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: `linear-gradient(135deg, ${role.color}20, transparent)`,
                      border: `1px solid ${role.color}`,
                      boxShadow: `0 0 15px ${role.color}40`,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={role.icon}
                      size="2x"
                      style={{ color: role.color }}
                    />
                  </div>

                  <h4 className="fw-bold text-white mb-2">{role.title}</h4>
                  <p className="small text-white-50 mb-4">{role.desc}</p>

                  <motion.button
                    className="btn btn-outline-light w-100 rounded-pill fw-bold mt-auto"
                    whileHover={{
                      backgroundColor: role.color,
                      borderColor: role.color,
                      color: "#000",
                    }}
                  >
                    Login <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </motion.button>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* --- Background Animated Orbs --- */}
        <motion.div
          className="position-absolute rounded-circle"
          style={{
            width: "400px",
            height: "400px",
            background: "#00d4ff",
            filter: "blur(150px)",
            top: "-10%",
            left: "-10%",
            opacity: 0.2,
            zIndex: 0,
          }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 10 }}
        />
        <motion.div
          className="position-absolute rounded-circle"
          style={{
            width: "350px",
            height: "350px",
            background: "#ff00cc",
            filter: "blur(150px)",
            bottom: "10%",
            right: "-5%",
            opacity: 0.15,
            zIndex: 0,
          }}
          animate={{ x: [0, -40, 0], y: [0, -40, 0] }}
          transition={{ repeat: Infinity, duration: 12 }}
        />
      </main>

      {/* --- Footer --- */}
      <motion.footer
        className="text-white text-center py-3"
        style={{
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(5px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)"
        }}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <small className="opacity-50">
          © 2026 Smart ClassRoom | University of Sialkot
        </small>
      </motion.footer>
    </div>
  );
};

export default MainRoles;