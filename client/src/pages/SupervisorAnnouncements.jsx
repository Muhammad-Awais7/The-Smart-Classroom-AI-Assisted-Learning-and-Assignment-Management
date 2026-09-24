import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, query, orderBy, serverTimestamp, doc, getDoc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPaperPlane, faBullhorn, faLock, faTrash, faEdit, faSave, faTimes, faUserGroup, faUserSecret } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const SupervisorAnnouncements = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [posts, setPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create New Post State
  const [newMessage, setNewMessage] = useState("");
  const [targetStudent, setTargetStudent] = useState("all");

  // Edit State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editTarget, setEditTarget] = useState("all");

  useEffect(() => {
    fetchStudents();

    // REAL-TIME LISTENER
    const q = query(collection(db, `classes/${classId}/announcements`), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  const fetchStudents = async () => {
    try {
      const classSnap = await getDoc(doc(db, "classes", classId));
      if (classSnap.exists()) {
        const enrolled = classSnap.data().enrolledStudents || [];
        const studentData = [];
        for (const uid of enrolled) {
          const uSnap = await getDoc(doc(db, "users", uid));
          if (uSnap.exists()) studentData.push({ id: uSnap.id, name: uSnap.data().name });
        }
        setStudents(studentData);
      }
    } catch (err) { console.error(err); }
  };

  // --- CREATE ---
  const handlePost = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
        await addDoc(collection(db, `classes/${classId}/announcements`), {
            text: newMessage,
            author: auth.currentUser.displayName || "Instructor",
            target: targetStudent,
            createdAt: serverTimestamp()
        });
        setNewMessage("");
        setTargetStudent("all");
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to post announcement.");
    }
  };

  // --- DELETE ---
  const handleDelete = async (postId) => {
      if(!window.confirm("Are you sure you want to delete this announcement?")) return;
      try {
          await deleteDoc(doc(db, `classes/${classId}/announcements`, postId));
      } catch (error) {
          alert("Error deleting post.");
      }
  };

  // --- EDIT START ---
  const startEdit = (post) => {
      setEditingPostId(post.id);
      setEditText(post.text);
      setEditTarget(post.target);
  };

  // --- EDIT SAVE ---
  const handleUpdate = async () => {
      if(!editText.trim()) return alert("Message cannot be empty");
      
      try {
          await updateDoc(doc(db, `classes/${classId}/announcements`, editingPostId), {
              text: editText,
              target: editTarget
          });
          setEditingPostId(null);
      } catch (error) {
          alert("Error updating post.");
      }
  };

  // Helper to get student name for display
  const getTargetName = (targetId) => {
      if(targetId === 'all') return "Everyone";
      const student = students.find(s => s.id === targetId);
      return student ? student.name : "Unknown Student";
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#0f0c29", color: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* Header */}
      <header className="py-3 px-4 border-bottom border-secondary bg-black bg-opacity-50 backdrop-blur sticky-top">
        <div className="container d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
                <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-light rounded-pill px-3 me-3">
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
                </button>
                <h5 className="m-0 fw-bold text-white">Class Announcements</h5>
            </div>
        </div>
      </header>

      <div className="container py-5" style={{ maxWidth: "800px" }}>
        
        {/* CREATE POST CARD */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="card border-0 shadow-lg mb-5 overflow-hidden" 
            style={{ borderRadius: "16px", background: "linear-gradient(145deg, #1e1e1e, #252525)" }}
        >
            <div className="card-header border-0 bg-transparent p-4 pb-0">
                 <h5 className="fw-bold text-white mb-0"><FontAwesomeIcon icon={faBullhorn} className="text-warning me-2"/> Create New Announcement</h5>
            </div>
            <div className="card-body p-4">
                <form onSubmit={handlePost}>
                    <div className="mb-3">
                        <label className="text-white-50 small mb-1 fw-bold">Target Audience</label>
                        <div className="input-group">
                            <span className="input-group-text bg-dark border-secondary text-white-50">
                                <FontAwesomeIcon icon={targetStudent === 'all' ? faUserGroup : faUserSecret} />
                            </span>
                            <select 
                                className="form-select bg-dark text-white border-secondary focus-ring-warning" 
                                value={targetStudent} 
                                onChange={(e) => setTargetStudent(e.target.value)}
                            >
                                <option value="all">Entire Class (Everyone)</option>
                                <optgroup label="Specific Student">
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    
                    <div className="mb-3">
                        <textarea 
                            className="form-control bg-dark text-white border-secondary" 
                            rows="3" 
                            placeholder="What do you want to announce?" 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)}
                            style={{ resize: "none" }}
                        />
                    </div>
                    
                    <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-warning px-4 fw-bold rounded-pill shadow-sm" disabled={!newMessage.trim()}>
                            <FontAwesomeIcon icon={faPaperPlane} className="me-2"/> Post Now
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>

        {/* POSTS LIST */}
        <div className="d-flex flex-column gap-3">
          <AnimatePresence>
            {posts.map(post => (
                <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={post.id} 
                    className="card border-0 shadow-sm"
                    style={{ background: "#1a1a1a", borderRadius: "12px" }}
                >
                <div className="card-body p-4">
                    
                    {editingPostId === post.id ? (
                        // --- EDIT MODE ---
                        <div className="bg-dark p-3 rounded border border-warning border-opacity-25">
                            <h6 className="text-warning mb-3 fw-bold">Editing Post</h6>
                            <div className="mb-3">
                                <label className="small text-white-50 mb-1">Audience:</label>
                                <select className="form-select form-select-sm bg-black text-white border-secondary" value={editTarget} onChange={(e) => setEditTarget(e.target.value)}>
                                    <option value="all">Entire Class</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <textarea 
                                className="form-control bg-black text-white border-secondary mb-3" 
                                rows="3" 
                                value={editText} 
                                onChange={(e) => setEditText(e.target.value)}
                            />
                            <div className="d-flex justify-content-end gap-2">
                                <button onClick={() => setEditingPostId(null)} className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                                    <FontAwesomeIcon icon={faTimes} className="me-1"/> Cancel
                                </button>
                                <button onClick={handleUpdate} className="btn btn-sm btn-success rounded-pill px-3">
                                    <FontAwesomeIcon icon={faSave} className="me-1"/> Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        // --- VIEW MODE ---
                        <>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <div className="d-flex align-items-center mb-1">
                                        <span className="fw-bold text-white me-2">{post.author}</span>
                                        <span className="badge bg-secondary text-light rounded-pill" style={{fontSize: '0.65rem'}}>Instructor</span>
                                    </div>
                                    <small className="text-white-50 d-flex align-items-center">
                                        <span className="me-1">To:</span> 
                                        <span className={`fw-bold ${post.target === 'all' ? 'text-info' : 'text-warning'}`}>
                                            {getTargetName(post.target)}
                                        </span> 
                                        {post.target !== 'all' && <FontAwesomeIcon icon={faLock} className="ms-2 text-white-50" title="Private Message" size="xs" />}
                                    </small>
                                </div>
                                
                                {/* Actions */}
                                <div className="dropdown">
                                    <div className="d-flex gap-2">
                                        <button onClick={() => startEdit(post)} className="btn btn-sm btn-outline-light border-0 opacity-50 hover-opacity-100 transition-all" title="Edit">
                                            <FontAwesomeIcon icon={faEdit}/>
                                        </button>
                                        <button onClick={() => handleDelete(post.id)} className="btn btn-sm btn-outline-danger border-0 opacity-50 hover-opacity-100 transition-all" title="Delete">
                                            <FontAwesomeIcon icon={faTrash}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-black bg-opacity-25 p-3 rounded border border-white border-opacity-10 mb-2">
                                <p className="card-text text-light mb-0" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>{post.text}</p>
                            </div>
                            
                            <div className="text-end">
                                <small className="text-white-50 fst-italic" style={{fontSize: '0.75rem'}}>
                                    Posted: {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                                </small>
                            </div>
                        </>
                    )}
                </div>
                </motion.div>
            ))}
          </AnimatePresence>
          {!loading && posts.length === 0 && (
              <div className="text-center py-5 text-white-50">
                  <p>No announcements shared yet.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SupervisorAnnouncements;