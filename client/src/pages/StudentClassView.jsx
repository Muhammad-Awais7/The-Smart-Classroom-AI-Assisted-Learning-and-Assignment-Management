import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faBullhorn, 
  faBookOpen, 
  faLaptopCode, 
  faChalkboardTeacher, 
  faGraduationCap,
  faComments,
  faStar
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const StudentClassView = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [instructorName, setInstructorName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId || classId === ":classId") {
        setError("Invalid URL.");
        setLoading(false);
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "classes", classId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClassData(data);
          
          if (data.instructorId) {
            const userSnap = await getDoc(doc(db, "users", data.instructorId));
            if (userSnap.exists()) {
                setInstructorName(userSnap.data().name);
            } else {
                setInstructorName(data.instructorName || "Instructor");
            }
          }
        } else {
            setError("Class not found.");
        }
      } catch (err) { 
          console.error(err);
          setError("System Error."); 
      } finally { 
          setLoading(false); 
      }
    };
    fetchClass();
  }, [classId]);

  if (loading) return (
    <div className="d-flex min-vh-100 justify-content-center align-items-center bg-black text-white">
        <div className="spinner-border text-info" role="status"></div>
    </div>
  );

  if (error) return (
    <div className="d-flex min-vh-100 justify-content-center align-items-center bg-black text-white flex-column">
        <h3 className="text-danger mb-3">{error}</h3>
        <button onClick={() => navigate("/StudentDashboard")} className="btn btn-outline-light">Return to Dashboard</button>
    </div>
  );

  return (
    <div className="d-flex flex-column min-vh-100" style={{ 
        background: "radial-gradient(circle at top center, #1a1a2e 0%, #000000 100%)", 
        color: "#fff", 
        fontFamily: "'Segoe UI', sans-serif" 
    }}>
      
      {/* Navbar */}
      <header className="py-3 px-4 border-bottom border-white border-opacity-10 bg-black bg-opacity-50 backdrop-blur sticky-top">
        <div className="container d-flex align-items-center">
            <button onClick={() => navigate("/StudentDashboard")} className="btn btn-sm btn-outline-light rounded-pill px-3 me-3">
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Dashboard
            </button>
            <span className="text-white-50 border-start border-secondary ps-3">Class Portal</span>
        </div>
      </header>

      <div className="container py-5">
        
        {/* Hero Banner */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="p-4 p-lg-5 mb-5 rounded-5 shadow-lg position-relative overflow-hidden" 
            style={{ 
                background: "linear-gradient(135deg, #6323c9 0%, #493240 100%)", // Vibrant Pink/Dark
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 10px 40px rgba(255, 0, 153, 0.3)"
            }}
        >
            <div className="position-absolute top-0 end-0 opacity-25 me-4 mt-3 text-white">
                <FontAwesomeIcon icon={faGraduationCap} size="10x" style={{ transform: "rotate(15deg)" }} />
            </div>

            <div className="position-relative z-1">
                <h1 className="display-4 fw-bold text-white mb-2">{classData?.name}</h1>
                <p className="text-white mb-4 fw-light fs-4 opacity-75">{classData?.subject} <span className="mx-2">•</span> {classData?.code}</p>
                <div className="d-inline-flex align-items-center bg-black bg-opacity-40 backdrop-blur px-4 py-2 rounded-pill border border-white border-opacity-25 shadow-sm">
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="me-2 text-warning" />
                    <span className="text-white fw-bold small text-uppercase tracking-wide">Instructor: {instructorName}</span>
                </div>
            </div>
        </motion.div>

        {/* Dashboard Grid - Larger Cards */}
        <div className="row g-4">
          
          {/* Announcements Card (Gold/Yellow Theme) */}
          <div className="col-md-6 col-lg-6 col-xl-3">
            <motion.div 
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 0 30px rgba(255, 193, 7, 0.5)" }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/student/class/${classId}/announcements`)} 
                className="card h-100 border-0 cursor-pointer overflow-hidden text-center position-relative"
                style={{ 
                    background: "linear-gradient(180deg, rgba(255,193,7,0.1) 0%, rgba(0,0,0,0.8) 100%)", 
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 193, 7, 0.4)",
                    minHeight: "260px"
                }}
            >
                <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center">
                    <div className="mb-4 bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-lg" 
                         style={{width: 90, height: 90, boxShadow: "0 0 20px rgba(255,193,7,0.4)"}}>
                        <FontAwesomeIcon icon={faBullhorn} size="3x" />
                    </div>
                    <h4 className="fw-bold text-white mb-2">Announcements</h4>
                    <p className="text-white-50 mb-0">Latest updates & news</p>
                </div>
            </motion.div>
          </div>

          {/* Assignments Card (Cyan/Blue Theme) */}
          <div className="col-md-6 col-lg-6 col-xl-3">
             <motion.div 
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 0 30px rgba(13, 202, 240, 0.5)" }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/student/class/${classId}/assignments`)} 
                className="card h-100 border-0 cursor-pointer overflow-hidden text-center"
                style={{ 
                    background: "linear-gradient(180deg, rgba(13,202,240,0.1) 0%, rgba(0,0,0,0.8) 100%)", 
                    borderRadius: "20px",
                    border: "1px solid rgba(13, 202, 240, 0.4)",
                    minHeight: "260px"
                }}
            >
                <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center">
                    <div className="mb-4 bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-lg" 
                         style={{width: 90, height: 90, boxShadow: "0 0 20px rgba(13,202,240,0.4)"}}>
                        <FontAwesomeIcon icon={faLaptopCode} size="3x" />
                    </div>
                    <h4 className="fw-bold text-white mb-2">Assignments</h4>
                    <p className="text-white-50 mb-0">Tasks & submissions</p>
                </div>
            </motion.div>
          </div>

          {/* Materials Card (Green/Emerald Theme) */}
          <div className="col-md-6 col-lg-6 col-xl-3">
              <motion.div 
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 0 30px rgba(32, 201, 151, 0.5)" }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/student/class/${classId}/materials`)} 
                className="card h-100 border-0 cursor-pointer overflow-hidden text-center"
                style={{ 
                    background: "linear-gradient(180deg, rgba(32,201,151,0.1) 0%, rgba(0,0,0,0.8) 100%)", 
                    borderRadius: "20px",
                    border: "1px solid rgba(32, 201, 151, 0.4)",
                    minHeight: "260px"
                }}
            >
                <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center">
                    <div className="mb-4 bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-lg" 
                         style={{width: 90, height: 90, color: "#20c997", boxShadow: "0 0 20px rgba(32,201,151,0.4)"}}>
                        <FontAwesomeIcon icon={faBookOpen} size="3x" />
                    </div>
                    <h4 className="fw-bold text-white mb-2">Materials</h4>
                    <p className="text-white-50 mb-0">PDFs & Resources</p>
                </div>
            </motion.div>
          </div>

          {/* Q&A Forum Card (Pink/Magenta Theme) */}
          <div className="col-md-6 col-lg-6 col-xl-3">
              <motion.div 
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 0 30px rgba(232, 62, 140, 0.5)" }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/student/class/${classId}/qa`)} 
                className="card h-100 border-0 cursor-pointer overflow-hidden text-center"
                style={{ 
                    background: "linear-gradient(180deg, rgba(232,62,140,0.1) 0%, rgba(0,0,0,0.8) 100%)", 
                    borderRadius: "20px",
                    border: "1px solid rgba(232, 62, 140, 0.4)",
                    minHeight: "260px"
                }}
            >
                <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center">
                    <div className="mb-4 bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-lg" 
                         style={{width: 90, height: 90, color: "#e83e8c", boxShadow: "0 0 20px rgba(232,62,140,0.4)"}}>
                        <FontAwesomeIcon icon={faComments} size="3x" />
                    </div>
                    <h4 className="fw-bold text-white mb-2">Q&A Forum</h4>
                    <p className="text-white-50 mb-0">Ask & Discuss</p>
                </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentClassView;