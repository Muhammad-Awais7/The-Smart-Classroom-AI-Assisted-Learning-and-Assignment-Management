import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBell,
  faChalkboardTeacher,
  faArrowRight,
  faPlusCircle,
  faListAlt
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { supervisorAuth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const SupervisorPanel = () => {
  const navigate = useNavigate();

  const [instructorName, setInstructorName] = useState("Instructor");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      supervisorAuth,
      async (user) => {
        // User logged in nahi hai
        if (!user) {
          navigate("/SupervisorLogin");
          setLoading(false);
          return;
        }

        try {
          // Firestore se current user ka data
          const docSnap = await getDoc(
            doc(db, "users", user.uid)
          );

          // User document nahi mila
          if (!docSnap.exists()) {
            await signOut(supervisorAuth);
            navigate("/SupervisorLogin");
            return;
          }

          const data = docSnap.data();

          // Sirf supervisor accounts ko access
          if (data.role !== "supervisor") {
            await signOut(supervisorAuth);
            navigate("/SupervisorLogin");
            return;
          }

          setInstructorName(
            data.name || "Instructor"
          );
        } catch (error) {
          console.error(
            "Error fetching user data:",
            error
          );

          await signOut(supervisorAuth);
          navigate("/SupervisorLogin");
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(supervisorAuth);
    } catch (error) {
      console.error(
        "Error signing out:",
        error
      );
    } finally {
      navigate("/");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const tasks = [
    {
      icon: faHome,
      label: "Main Page",
      route: "/main",
      color: "#00d4ff",
      desc: "Return to the main landing page"
    },
    {
      icon: faPlusCircle,
      label: "Create ClassRoom",
      route: "/create-class",
      color: "#00ff9d",
      desc: "Initialize a new class"
    },
    {
      icon: faListAlt,
      label: "View My Classes",
      route: "/supervisor/my-classes",
      color: "#5500ff",
      desc: "Manage existing classes"
    },
    {
      icon: faBell,
      label: "Notifications",
      route: "/supnot",
      color: "#ff9900",
      desc: "Check latest system updates"
    }
  ];

  // Loading Screen
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{
          background: "#0f0c29",
          color: "#fff"
        }}
      >
        <div
          className="spinner-border"
          style={{ color: "#ff00cc" }}
          role="status"
        >
          <span className="visually-hidden">
            Loading...
          </span>
        </div>
      </div>
    );
  }

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
      {/* --- Background Animated Orbs --- */}
      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "500px",
          height: "500px",
          background: "#ff00cc",
          filter: "blur(180px)",
          top: "-20%",
          left: "-10%",
          opacity: 0.3,
          zIndex: 0
        }}
        animate={{ scale: [1, 1.1, 1], x: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 15 }}
      />
      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "400px",
          height: "400px",
          background: "#333399",
          filter: "blur(150px)",
          bottom: "-10%",
          right: "-10%",
          opacity: 0.15,
          zIndex: 0
        }}
        animate={{ scale: [1, 1.2, 1], y: [0, -40, 0] }}
        transition={{ repeat: Infinity, duration: 10 }}
      />

      {/* --- Navbar (PMO-style) --- */}
      <motion.header
        className="py-3 px-4 shadow-lg d-flex justify-content-between align-items-center"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 10
        }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
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
              icon={faChalkboardTeacher}
              className="text-info"
            />
          </div>
          {instructorName}
          <span className="fw-light ms-2 opacity-75">
            Dashboard
          </span>
        </h3>

        {/* Logout / Exit Button */}
        <button
          className="btn btn-outline-warning btn-sm rounded-pill px-3"
          onClick={handleLogout}
        >
          Logout
        </button>
      </motion.header>

      {/* --- Main Content --- */}
      <main
        className="flex-grow-1 container py-5 d-flex flex-column justify-content-center position-relative"
        style={{ zIndex: 5 }}
      >
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="fw-bold display-5">
            Instructor Control Center
          </h2>
          <p className="text-white-50 fs-5">
            Manage your students and their projects
          </p>
        </motion.div>

        <motion.div
          className="row g-4 justify-content-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {tasks.map((item, idx) => (
            <div className="col-md-6 col-lg-4" key={idx}>
              <motion.div
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  boxShadow: `0 0 30px ${item.color}60`,
                  borderColor: item.color
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(item.route)}
                className="card h-100 p-4 border-0 text-start text-white position-relative overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "20px",
                  cursor: "pointer"
                }}
              >
                {/* Colored Glow Bar at top */}
                <div
                  className="position-absolute top-0 start-0 w-100"
                  style={{ height: "4px", background: item.color }}
                />

                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "60px",
                      height: "60px",
                      background: `${item.color}20`,
                      color: item.color
                    }}
                  >
                    <FontAwesomeIcon icon={item.icon} size="lg" />
                  </div>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-white-50"
                  />
                </div>

                <h4 className="fw-bold mb-2">{item.label}</h4>
                <p className="small text-white-50 mb-0">{item.desc}</p>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* --- Footer --- */}
      <motion.footer
        className="text-white text-center py-3"
        style={{
          background: "rgba(0,0,0,0.2)",
          backdropFilter: "blur(5px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <small className="opacity-50">
          © 2026 Smart ClassRoom - Instructor Panel
        </small>
      </motion.footer>
    </div>
  );
};

export default SupervisorPanel;