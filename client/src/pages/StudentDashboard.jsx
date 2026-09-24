import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserGraduate,
  FaSignInAlt,
  FaBell,
  FaBook,
  FaArrowRight,
  FaSignOutAlt,
  FaEnvelope
} from "react-icons/fa";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

const Studentdash = () => {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/StudentLogin");
        setLoading(false);
        return;
      }

      try {
        setStudentEmail(user.email || "");

        // Get user data from Firestore
        const docSnap = await getDoc(doc(db, "users", user.uid));

        // User document doesn't exist
        if (!docSnap.exists()) {
          await signOut(auth);
          navigate("/StudentLogin");
          return;
        }

        const data = docSnap.data();

        // Only student accounts can access Student Dashboard
        if (data.role !== "student") {
          await signOut(auth);
          navigate("/StudentLogin");
          return;
        }

        setStudentName(data.name || "Student");

        if (data.email) {
          setStudentEmail(data.email);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        await signOut(auth);
        navigate("/StudentLogin");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      navigate("/");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const dashboardItems = [
    {
      icon: FaSignInAlt,
      label: "Main Page",
      route: "/main",
      color: "#00d4ff",
      desc: "Go to landing page"
    },
    {
      icon: FaBook,
      label: "Join Classroom",
      route: "/join-class",
      color: "#ff0000",
      desc: "Enter code to join"
    },
    {
      icon: FaBook,
      label: "My Classrooms",
      route: "/student/my-classes",
      color: "#00ff33",
      desc: "View your active classes"
    },
    {
      icon: FaBell,
      label: "Notifications",
      route: "/studentreceive",
      color: "#ff00cc",
      desc: "View system alerts"
    },
    {
      icon: FaBook,
      label: "Plagiarism Detection",
      route: "/plagrismstud",
      color: "#00d4ff",
      desc: "Analyze Plagiarism"
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
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const initialLetter = studentName
    ? studentName.charAt(0).toUpperCase()
    : "S";

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
      {/* Background Animated Glows */}
      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "500px",
          height: "500px",
          background: "#00d4ff",
          filter: "blur(180px)",
          top: "-15%",
          left: "-10%",
          opacity: 0.15,
          zIndex: 0
        }}
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 15 }}
      />

      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "400px",
          height: "400px",
          background: "#bd00ff",
          filter: "blur(150px)",
          bottom: "-10%",
          right: "-10%",
          opacity: 0.15,
          zIndex: 0
        }}
        animate={{ scale: [1, 1.1, 1], y: [0, -40, 0] }}
        transition={{ repeat: Infinity, duration: 12 }}
      />

      {/* Header */}
      <motion.header
        className="py-3 px-4 shadow-lg d-flex justify-content-between align-items-center position-relative"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 100
        }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h3 className="m-0 fw-bold d-flex align-items-center text-white fs-4">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle me-3"
            style={{
              width: "45px",
              height: "45px",
              background: "rgba(255,255,255,0.1)"
            }}
          >
            <FaUserGraduate style={{ color: "#00d4ff" }} />
          </div>

          Welcome,
          <span className="text-info ms-2">{studentName}</span>
        </h3>

        {/* Profile Avatar & Dropdown */}
        <div
          className="position-relative"
          ref={profileDropdownRef}
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              setShowProfileMenu((prev) => !prev)
            }
            aria-label="Student profile menu"
            className="rounded-circle border-0 d-flex align-items-center justify-content-center fw-bold shadow"
            style={{
              width: "44px",
              height: "44px",
              background:
                "linear-gradient(135deg, #00d4ff, #007cf0)",
              color: "#fff",
              fontSize: "1.15rem",
              cursor: "pointer",
              boxShadow:
                "0 0 15px rgba(0, 212, 255, 0.4)",
              outline: showProfileMenu
                ? "2px solid #00d4ff"
                : "none"
            }}
          >
            {initialLetter}
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                  scale: 0.95
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  scale: 0.95
                }}
                transition={{ duration: 0.2 }}
                className="position-absolute end-0 mt-3 p-3 rounded-4 shadow-lg"
                style={{
                  width: "290px",
                  background:
                    "rgba(20, 16, 45, 0.95)",
                  backdropFilter: "blur(20px)",
                  border:
                    "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow:
                    "0 15px 35px rgba(0,0,0,0.6)",
                  zIndex: 1000
                }}
              >
                {/* Account Details */}
                <div className="text-center pb-3 border-bottom border-white border-opacity-10">
                  <div
                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center fw-bold mb-2 shadow"
                    style={{
                      width: "60px",
                      height: "60px",
                      background:
                        "linear-gradient(135deg, #00d4ff, #007cf0)",
                      color: "#fff",
                      fontSize: "1.5rem"
                    }}
                  >
                    {initialLetter}
                  </div>

                  <h6 className="fw-bold text-white mb-1 text-truncate">
                    {studentName}
                  </h6>

                  <p
                    className="text-white-50 small mb-2 text-truncate px-2 d-flex align-items-center justify-content-center gap-1"
                    title={studentEmail}
                  >
                    <FaEnvelope size={12} />
                    <span>
                      {studentEmail ||
                        "student@smartclassroom.com"}
                    </span>
                  </p>

                  <span
                    className="badge rounded-pill px-3 py-1"
                    style={{
                      background:
                        "rgba(0, 212, 255, 0.15)",
                      color: "#00d4ff",
                      border:
                        "1px solid rgba(0, 212, 255, 0.3)",
                      fontSize: "0.75rem"
                    }}
                  >
                    Student Account
                  </span>
                </div>

                {/* Logout */}
                <div className="pt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="btn w-100 btn-outline-danger btn-sm rounded-pill d-flex align-items-center justify-content-center gap-2 py-2"
                    style={{
                      borderColor:
                        "rgba(220, 53, 69, 0.5)",
                      background:
                        "rgba(220, 53, 69, 0.1)"
                    }}
                  >
                    <FaSignOutAlt />
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Main Content */}
      <main
        className="flex-grow-1 container py-5 position-relative"
        style={{ zIndex: 5 }}
      >
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="fw-bold display-5">
            Student Dashboard
          </h2>

          <p className="text-white-50 fs-5">
            Select an action to proceed
          </p>
        </motion.div>

        <motion.div
          className="row g-4 justify-content-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {dashboardItems.map((item, idx) => (
            <div
              className="col-md-6 col-lg-4 col-xl-3"
              key={idx}
            >
              <motion.div
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  boxShadow: `0 0 30px ${item.color}60`,
                  borderColor: item.color
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.route)}
                className="card h-100 p-4 border-0 text-start text-white position-relative overflow-hidden"
                style={{
                  background:
                    "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(15px)",
                  border:
                    "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "20px",
                  cursor: "pointer"
                }}
              >
                <div
                  className="mb-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    background: `${item.color}20`,
                    border: `1px solid ${item.color}40`,
                    color: item.color
                  }}
                >
                  <item.icon size={24} />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="fw-bold mb-0 text-truncate">
                    {item.label}
                  </h5>

                  <FaArrowRight className="text-white-50 small" />
                </div>

                <p
                  className="small text-white-50 mb-0"
                  style={{ fontSize: "0.85rem" }}
                >
                  {item.desc}
                </p>

                <div
                  className="position-absolute bottom-0 end-0 p-5"
                  style={{
                    background: item.color,
                    filter: "blur(60px)",
                    opacity: 0.1,
                    borderRadius: "50%"
                  }}
                />
              </motion.div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="text-white text-center py-3"
        style={{
          background: "rgba(0,0,0,0.2)",
          backdropFilter: "blur(5px)",
          borderTop:
            "1px solid rgba(255, 255, 255, 0.05)"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <small className="opacity-50">
          © 2026 Smart ClassRoom - Student Panel
        </small>
      </motion.footer>
    </div>
  );
};

export default Studentdash;