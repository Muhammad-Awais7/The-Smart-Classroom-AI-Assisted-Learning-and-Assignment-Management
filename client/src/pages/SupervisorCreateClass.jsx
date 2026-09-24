import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChalkboardTeacher, faMagic } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const SupervisorCreateClass = () => {
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateClassCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      navigate("/");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!className || !subject) return;

    setLoading(true);
    const code = generateClassCode();

    try {
      const docRef = await addDoc(collection(db, "classes"), {
        name: className,
        subject: subject,
        code: code,
        instructorId: auth.currentUser.uid,
        instructorName: auth.currentUser.displayName || "Instructor",
        createdAt: serverTimestamp(),
        enrolledStudents: [],
      });
      
      navigate(`/supervisor/class/${docRef.id}`);

    } catch (error) {
      console.error("Error creating class:", error);
      alert("Failed to create class.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex flex-column min-vh-100 position-relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        color: "#fff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header with Back and Logout buttons */}
      <motion.header
        className="py-3 px-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 10 }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button 
          onClick={() => navigate("/SupervisorDashboard")}
          className="btn btn-outline-light rounded-pill btn-sm px-3"
          style={{ borderColor: "rgba(255,255,255,0.3)" }}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
        </button>

        <button 
          onClick={handleLogout}
          className="btn btn-outline-light rounded-pill btn-sm px-3"
          style={{ borderColor: "rgba(255,255,255,0.3)" }}
        >
          Logout
        </button>
      </motion.header>

      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 position-relative" style={{ zIndex: 2 }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="card p-5 border-0 shadow-lg"
          style={{
            maxWidth: "500px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
          }}
        >
          <div className="text-center mb-4">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: "70px", height: "70px", background: "rgba(0, 212, 255, 0.1)", border: "1px solid #00d4ff", boxShadow: "0 0 15px rgba(0,212,255,0.3)" }}
            >
              <FontAwesomeIcon icon={faChalkboardTeacher} size="2x" style={{ color: "#00d4ff" }} />
            </div>
            <h2 className="fw-bold">Create Classroom</h2>
            <p className="text-white-50">Set up a new space for your students.</p>
          </div>

          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="form-label text-info small fw-bold">CLASS NAME</label>
              <input
                type="text"
                className="form-control form-control-lg text-white"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                placeholder="e.g. Web Development 101"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-info small fw-bold">SUBJECT / CODE</label>
              <input
                type="text"
                className="form-control form-control-lg text-white"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                placeholder="e.g. CS-202"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="btn btn-lg w-100 fw-bold text-white"
              style={{
                background: "linear-gradient(45deg, #00d4ff, #007cf0)",
                border: "none",
                borderRadius: "10px",
                boxShadow: "0 0 15px rgba(0, 212, 255, 0.4)"
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(0, 212, 255, 0.6)" }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Creating..." : (
                <>
                  <FontAwesomeIcon icon={faMagic} className="me-2" /> Initialize Class
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>

      <footer className="text-white-50 text-center py-3 mt-auto border-top border-white border-opacity-10" style={{ background: "rgba(0,0,0,0.3)" }}>
        <small>© 2026 Smart ClassRoom - Instructor Panel</small>
      </footer>
    </div>
  );
};

export default SupervisorCreateClass;