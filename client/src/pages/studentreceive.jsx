import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faBullhorn, 
  faClock, 
  faEnvelopeOpen,
  faBell 
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "roleAnnouncements"),
      where("visibleTo", "array-contains", "student"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ 
        background: "radial-gradient(circle at center, #1a1a2e 0%, #0f0c29 100%)", 
        color: "#fff",
        fontFamily: "'Segoe UI', sans-serif"
      }}
    >
      
      {/* Header */}
      <header
        className="py-3 px-4 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 sticky-top"
        style={{ 
          background: "rgba(0, 0, 0, 0.4)", 
          backdropFilter: "blur(15px)" 
        }}
      >
        <div className="d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{width: 45, height: 45}}>
                <FontAwesomeIcon icon={faBullhorn} className="text-warning fs-4" />
            </div>
            <h4 className="m-0 fw-bold text-white">Student Announcements</h4>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/StudentDashboard")}
          className="btn btn-outline-light rounded-pill px-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Dashboard
        </motion.button>
      </header>

      {/* Main Content */}
      <Container className="flex-grow-1 py-5">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            
            <AnimatePresence>
              {announcements.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-5 rounded-4 border border-white border-opacity-10"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <FontAwesomeIcon icon={faEnvelopeOpen} className="text-white-50 display-1 mb-3" />
                  <h4 className="text-white-50">No announcements yet.</h4>
                  <p className="text-secondary">Stay tuned for updates!</p>
                </motion.div>
              ) : (
                announcements.map((a, index) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="mb-4 position-relative overflow-hidden"
                  >
                    {/* Glowing Left Border */}
                    <div 
                      className="position-absolute top-0 start-0 bottom-0 bg-warning" 
                      style={{ width: "4px", boxShadow: "0 0 15px #ffc107" }} 
                    />

                    <div 
                      className="p-4 rounded-end-4 rounded-start-1"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderLeft: "none",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 5px 20px rgba(0,0,0,0.3)"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-bold mb-0 text-white d-flex align-items-center">
                          <FontAwesomeIcon icon={faBell} className="text-warning me-2 fs-6" />
                          {a.title || "Announcement"}
                        </h5>
                        
                        {a.createdAt?.toDate && (
                          <small className="text-white-50 d-flex align-items-center" style={{fontSize: '0.75rem'}}>
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {a.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </small>
                        )}
                      </div>

                      <hr className="border-white opacity-10 my-3" />

                      <p className="mb-0 text-light" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                        {a.message}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer
        className="text-white-50 text-center py-3 mt-auto border-top border-white border-opacity-10"
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        <small>© 2026 Smart ClassRoom - Student Panel</small>
      </footer>
    </div>
  );
}