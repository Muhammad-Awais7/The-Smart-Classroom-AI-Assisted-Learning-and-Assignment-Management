import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faBullhorn, 
  faCheckCircle, 
  faClock, 
  faEnvelopeOpen 
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

export default function SupervisorAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(
      collection(db, "roleAnnouncements"),
      where("visibleTo", "array-contains", "supervisor"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });

    return () => unsubscribe();
  }, []);

  // ✅ Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      navigate("/");
    }
  };

  // ✅ Mark as Read
  const markAsRead = async (id) => {
    if (!currentUser) return;
    const announcementRef = doc(db, "roleAnnouncements", id);
    await updateDoc(announcementRef, {
      readBy: arrayUnion(currentUser.uid),
    });
  };

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ 
        background: "radial-gradient(circle at top, #0f0c29 0%, #302b63 100%)", 
        color: "#fff",
        fontFamily: "'Segoe UI', sans-serif"
      }}
    >
      
      {/* Header */}
      <header
        className="py-3 px-4 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 sticky-top"
        style={{ 
          background: "rgba(0, 0, 0, 0.4)", 
          backdropFilter: "blur(15px)",
          zIndex: 10
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{width: 45, height: 45}}>
            <FontAwesomeIcon icon={faBullhorn} className="text-info fs-4" />
          </div>
          <h4 className="m-0 fw-bold text-white">Supervisor Announcements</h4>
        </div>
        
        {/* Navigation & Logout Buttons */}
        <div className="d-flex align-items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/SupervisorDashboard")}
            className="btn btn-outline-light rounded-pill px-3 px-md-4 btn-sm"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Dashboard
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="btn btn-outline-light btn-sm rounded-pill px-3"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          >
            Logout
          </motion.button>
        </div>
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
                  <p className="text-secondary">You're all caught up!</p>
                </motion.div>
              ) : (
                announcements.map((a, index) => {
                  const isRead = a.readBy?.includes(currentUser?.uid);

                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="mb-4 position-relative overflow-hidden"
                    >
                      {/* Neon Border Effect for Unread */}
                      {!isRead && (
                        <div 
                          className="position-absolute top-0 start-0 bottom-0 bg-info" 
                          style={{ width: "4px", boxShadow: "0 0 15px #0dcaf0" }} 
                        />
                      )}

                      <div 
                        className="p-4 rounded-end-4 rounded-start-1"
                        style={{
                          background: isRead ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderLeft: "none",
                          backdropFilter: "blur(10px)",
                          boxShadow: isRead ? "none" : "0 5px 20px rgba(0,0,0,0.3)"
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className={`fw-bold mb-0 ${isRead ? "text-white-50" : "text-white"}`}>
                            {!isRead && <span className="badge bg-danger me-2 shadow-sm" style={{fontSize: '0.6rem', verticalAlign: 'middle'}}>NEW</span>}
                            {a.title}
                          </h5>
                          
                          {a.createdAt?.toDate && (
                            <small className="text-white-50 d-flex align-items-center" style={{fontSize: '0.75rem'}}>
                              <FontAwesomeIcon icon={faClock} className="me-1" />
                              {a.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </small>
                          )}
                        </div>

                        <p className={`mb-4 ${isRead ? "text-secondary" : "text-light"}`} style={{ whiteSpace: "pre-wrap" }}>
                          {a.message}
                        </p>

                        <div className="d-flex justify-content-end">
                          {!isRead ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="btn btn-sm btn-info text-white fw-bold rounded-pill px-3 shadow-sm"
                              style={{ background: "linear-gradient(45deg, #0dcaf0, #0d6efd)", border: "none" }}
                              onClick={() => markAsRead(a.id)}
                            >
                              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                              Mark as Read
                            </motion.button>
                          ) : (
                            <div className="text-success small fw-bold opacity-50 d-flex align-items-center">
                              <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Read
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
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
        <small>© 2026 Smart ClassRoom - Instructor Panel</small>
      </footer>
    </div>
  );
}