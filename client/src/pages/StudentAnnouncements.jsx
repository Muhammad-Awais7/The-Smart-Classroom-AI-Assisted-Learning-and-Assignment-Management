import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; // Added onSnapshot for real-time
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBullhorn, faLock, faCheckCircle, faCircle, faUserTie, faBellSlash, faClock } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const StudentAnnouncements = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Local "Read" State
  const [readPosts, setReadPosts] = useState(() => {
      const saved = localStorage.getItem(`read_announcements_${classId}`);
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. REAL-TIME LISTENER (onSnapshot instead of getDocs)
    const q = query(collection(db, `classes/${classId}/announcements`), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const myPosts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(post => post.target === 'all' || post.target === user.uid);
      
      setPosts(myPosts);
      setLoading(false);
    });

    // Cleanup listener when leaving page
    return () => unsubscribe();
  }, [classId]);

  const toggleRead = (id) => {
      let newRead;
      if (readPosts.includes(id)) {
          newRead = readPosts.filter(item => item !== id);
      } else {
          newRead = [...readPosts, id];
      }
      setReadPosts(newRead);
      localStorage.setItem(`read_announcements_${classId}`, JSON.stringify(newRead));
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#0f0c29", color: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* Header */}
      <header className="py-3 px-4 border-bottom border-secondary bg-black bg-opacity-50 backdrop-blur sticky-top">
        <div className="container d-flex align-items-center">
            <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-light rounded-pill px-3 me-3">
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
            </button>
            <h5 className="m-0 fw-bold text-white">Class Updates</h5>
        </div>
      </header>

      <div className="container py-5" style={{ maxWidth: "800px" }}>
        
        {/* Title Banner */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-5"
        >
           <div className="d-inline-flex align-items-center justify-content-center bg-gradient text-white rounded-circle mb-3 shadow-lg" 
                style={{ width: 80, height: 80, background: "linear-gradient(135deg, #FFD700, #FDB931)" }}>
             <FontAwesomeIcon icon={faBullhorn} size="2x" className="text-dark" />
           </div>
           <h2 className="fw-bold text-white">Notice Board</h2>
           <p className="text-white-50">Stay updated with the latest news from your instructor.</p>
        </motion.div>

        {/* Loading State */}
        {loading && (
            <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status"></div>
                <p className="mt-2 text-white-50">Listening for updates...</p>
            </div>
        )}

        {/* Announcements Feed */}
        <div className="d-flex flex-column gap-4">
          <AnimatePresence>
            {!loading && posts.length === 0 ? (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-5 opacity-50">
                    <FontAwesomeIcon icon={faBellSlash} size="3x" className="mb-3"/>
                    <h4>No announcements yet</h4>
                    <p>Enjoy the silence!</p>
                </motion.div>
            ) : (
                posts.map((post, index) => {
                    const isRead = readPosts.includes(post.id);
                    const isPrivate = post.target !== 'all';

                    return (
                    <motion.div 
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`card border-0 shadow-lg overflow-hidden position-relative rounded-4 ${isRead ? "opacity-75" : ""}`}
                        style={{ background: isRead ? "#1a1a1a" : "#252525" }}
                    >
                        {/* Left Color Bar Indicator */}
                        <div className={`position-absolute top-0 bottom-0 start-0 ${isPrivate ? "bg-warning" : "bg-info"}`} style={{ width: "4px" }}></div>

                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="d-flex align-items-center">
                                    {/* Author Avatar */}
                                    <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${isPrivate ? "bg-warning text-dark" : "bg-info text-dark"}`} 
                                         style={{ width: 45, height: 45 }}>
                                        <FontAwesomeIcon icon={isPrivate ? faLock : faUserTie} size="lg"/>
                                    </div>
                                    
                                    <div>
                                        <h6 className="mb-0 fw-bold text-white d-flex align-items-center">
                                            {post.author}
                                            {/* Badges */}
                                            {isPrivate && <span className="badge bg-warning text-dark ms-2 rounded-pill px-2" style={{fontSize: '0.6rem'}}>PRIVATE</span>}
                                            {!isRead && <span className="badge bg-danger ms-2 rounded-pill px-2 shadow-sm" style={{fontSize: '0.6rem'}}>NEW</span>}
                                        </h6>
                                        <small className="text-white-50 d-flex align-items-center" style={{fontSize: '0.75rem'}}>
                                            <FontAwesomeIcon icon={faClock} className="me-1"/>
                                            {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Just now"}
                                        </small>
                                    </div>
                                </div>

                                {/* Mark Read/Unread Toggle */}
                                <button 
                                    onClick={() => toggleRead(post.id)} 
                                    className="btn btn-link p-0 text-decoration-none transition-all" 
                                    title={isRead ? "Mark as Unread" : "Mark as Read"}
                                    style={{ opacity: isRead ? 0.5 : 1 }}
                                >
                                    <FontAwesomeIcon icon={isRead ? faCheckCircle : faCircle} className={isRead ? "text-success fs-3" : "text-secondary fs-3"} />
                                </button>
                            </div>
                            
                            {/* Message Content */}
                            <div className="ps-0 ps-md-5">
                                <p className="text-light mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '1.05rem' }}>
                                    {post.text}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )})
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StudentAnnouncements;