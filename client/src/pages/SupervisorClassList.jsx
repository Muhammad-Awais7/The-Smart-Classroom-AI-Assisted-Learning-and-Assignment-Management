import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChalkboardTeacher, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const SupervisorClassList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch classes created by this instructor
        const q = query(collection(db, "classes"), where("instructorId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const classList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setClasses(classList);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", color: "#fff" }}>
      <header className="p-4">
        <button onClick={() => navigate("/SupervisorDashboard")} className="btn btn-outline-light rounded-pill btn-sm">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back to Dashboard
        </button>
      </header>

      <div className="container py-4">
        <h2 className="mb-4 fw-bold">My Classrooms</h2>
        
        {loading ? (
           <div className="text-center"><div className="spinner-border text-info"></div></div>
        ) : classes.length === 0 ? (
          <div className="text-center p-5 border border-white border-opacity-10 rounded-4">
            <h4>No classes found.</h4>
            <button onClick={() => navigate("/create-class")} className="btn btn-success mt-3 rounded-pill">Create Your First Class</button>
          </div>
        ) : (
          <div className="row g-4">
            {classes.map((cls) => (
              <div key={cls.id} className="col-md-4">
                <motion.div
                  whileHover={{ y: -5, boxShadow: "0 0 20px rgba(85, 0, 255, 0.4)" }}
                  className="card h-100 p-4 border-0 text-white"
                  style={{ background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(85, 0, 255, 0.3)", borderRadius: "15px" }}
                >
                  <FontAwesomeIcon icon={faChalkboardTeacher} className="mb-3 fs-2 text-info" />
                  <h4>{cls.name}</h4>
                  <p className="text-white-50">{cls.subject}</p>
                  <button 
                    onClick={() => navigate(`/supervisor/class/${cls.id}`)} 
                    className="btn btn-primary w-100 mt-auto rounded-pill"
                    style={{ background: "#5500ff", border: "none" }}
                  >
                    Enter Class <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </button>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorClassList;