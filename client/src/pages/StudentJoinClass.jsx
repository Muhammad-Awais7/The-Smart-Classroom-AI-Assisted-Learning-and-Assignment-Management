import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSignInAlt } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const StudentJoinClass = () => {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Find the class with this code
      const q = query(collection(db, "classes"), where("code", "==", joinCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid Class Code.");
        setLoading(false);
        return;
      }

      // 2. Add student to the class
      const classDoc = querySnapshot.docs[0];
      const classRef = doc(db, "classes", classDoc.id);
      
      await updateDoc(classRef, {
        enrolledStudents: arrayUnion(auth.currentUser.uid)
      });

      // *** FIX IS HERE: Used backticks ` ` ***
      navigate(`/student/class/${classDoc.id}`);

    } catch (err) {
      console.error(err);
      setError("System Error.");
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
      <motion.header className="py-3 px-4" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <button onClick={() => navigate("/StudentDashboard")} className="btn btn-outline-light rounded-pill btn-sm">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Dashboard
        </button>
      </motion.header>

      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 position-relative" style={{ zIndex: 2 }}>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card p-5 border-0 shadow-lg"
          style={{
            maxWidth: "450px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
          }}
        >
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2  text-white">Join Class</h2>
            <p className="text-white-50">Enter the 6-digit code provided by your teacher.</p>
          </div>

          <form onSubmit={handleJoin}>
            <div className="mb-4">
              <input
                type="text"
                className="form-control form-control-lg text-white text-center fw-bold"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "2px solid #00d4ff",
                  borderRadius: "10px",
                  fontSize: "2rem",
                  letterSpacing: "0.5rem",
                  textTransform: "uppercase"
                }}
                maxLength={6}
                placeholder="------"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            {error && <div className="alert alert-danger py-2 text-center small bg-danger bg-opacity-25 border-danger text-white">{error}</div>}

            <motion.button
              type="submit"
              disabled={loading}
              className="btn btn-lg w-100 fw-bold text-black"
              style={{
                background: "#00d4ff",
                border: "none",
                borderRadius: "10px",
                boxShadow: "0 0 15px rgba(0, 212, 255, 0.5)"
              }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(0, 212, 255, 0.8)" }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? "Joining..." : (
                <>
                   Enter Classroom <FontAwesomeIcon icon={faSignInAlt} className="ms-2" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default StudentJoinClass;