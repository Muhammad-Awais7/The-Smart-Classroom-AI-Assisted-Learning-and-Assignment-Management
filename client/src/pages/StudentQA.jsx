import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faQuestionCircle, faPaperPlane, faReply, faUser, faCheckCircle, faTrash, faEdit, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const StudentQA = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetchUserName();
    const q = query(collection(db, `classes/${classId}/questions`), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [classId]);

  const fetchUserName = async () => {
      if(auth.currentUser) {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if(userDoc.exists()) setStudentName(userDoc.data().name);
      }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    await addDoc(collection(db, `classes/${classId}/questions`), {
      text: newQuestion,
      studentId: auth.currentUser.uid,
      studentName: studentName, // Uses fetched name
      createdAt: serverTimestamp(),
      reply: "",
      replyDate: null
    });
    setNewQuestion("");
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this question?")) return;
      await deleteDoc(doc(db, `classes/${classId}/questions`, id));
  };

  const startEdit = (q) => {
      setEditingId(q.id);
      setEditText(q.text);
  };

  const saveEdit = async (id) => {
      if(!editText.trim()) return;
      await updateDoc(doc(db, `classes/${classId}/questions`, id), { text: editText });
      setEditingId(null);
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#0f0c29", color: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      
      <header className="py-3 px-4 border-bottom border-secondary bg-black bg-opacity-50 backdrop-blur sticky-top">
        <div className="container d-flex align-items-center">
            <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-light rounded-pill px-3 me-3">
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
            </button>
            <h5 className="m-0 fw-bold text-white">Class Q&A Forum</h5>
        </div>
      </header>

      <div className="container py-5">
        
        {/* Ask Question Box */}
        <div className="card border-0 shadow-lg mb-5 overflow-hidden mx-auto" style={{ maxWidth: "800px", borderRadius: "16px", background: "linear-gradient(145deg, #1e1e1e, #252525)" }}>
            <div className="card-body p-4">
                <h5 className="fw-bold text-white mb-3"><FontAwesomeIcon icon={faQuestionCircle} className="text-info me-2"/> Ask a Question</h5>
                <form onSubmit={handleSubmit}>
                    <textarea 
                        className="form-control bg-dark text-white border-secondary mb-3" 
                        rows="2" 
                        placeholder={`What's on your mind, ${studentName}?`} 
                        value={newQuestion} 
                        onChange={(e) => setNewQuestion(e.target.value)}
                        style={{ resize: "none" }}
                    />
                    <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-info px-4 fw-bold rounded-pill shadow-sm" disabled={!newQuestion.trim()}>
                            <FontAwesomeIcon icon={faPaperPlane} className="me-2"/> Post
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* Questions Grid */}
        <h5 className="text-white-50 mb-4 ps-2">Recent Discussions</h5>
        
        <div className="row g-4">
          <AnimatePresence>
            {questions.map((q) => {
                const isMyQuestion = auth.currentUser && q.studentId === auth.currentUser.uid;

                return (
                <div key={q.id} className="col-md-6 col-lg-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="card border-0 shadow-sm h-100 d-flex flex-column"
                        style={{ background: "#1a1a1a", borderRadius: "12px", borderTop: q.reply ? "4px solid #198754" : "4px solid #0dcaf0" }}
                    >
                        <div className="card-body p-4 d-flex flex-column">
                            {/* Header */}
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: 32, height: 32}}>
                                        <FontAwesomeIcon icon={faUser} size="sm" />
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-bold text-white small">{q.studentName}</h6>
                                        <small className="text-white-50" style={{fontSize: '0.65rem'}}>
                                            {q.createdAt?.seconds ? new Date(q.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                                        </small>
                                    </div>
                                </div>
                                {isMyQuestion && !q.reply && (
                                    <div className="dropdown">
                                        <button onClick={() => startEdit(q)} className="btn btn-link p-0 me-2 text-white-50"><FontAwesomeIcon icon={faEdit}/></button>
                                        <button onClick={() => handleDelete(q.id)} className="btn btn-link p-0 text-danger"><FontAwesomeIcon icon={faTrash}/></button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Question Text */}
                            {editingId === q.id ? (
                                <div className="flex-grow-1">
                                    <textarea className="form-control bg-black text-white mb-2" value={editText} onChange={e=>setEditText(e.target.value)} rows={3}/>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button onClick={() => setEditingId(null)} className="btn btn-sm btn-outline-secondary"><FontAwesomeIcon icon={faTimes}/></button>
                                        <button onClick={() => saveEdit(q.id)} className="btn btn-sm btn-success"><FontAwesomeIcon icon={faSave}/></button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-light flex-grow-1 mb-3" style={{fontSize: '0.95rem', minHeight: '50px'}}>{q.text}</p>
                            )}

                            {/* Reply Section */}
                            {q.reply ? (
                                <div className="mt-auto p-3 rounded bg-dark border border-success border-opacity-25 position-relative">
                                    <div className="d-flex align-items-center mb-1">
                                        <FontAwesomeIcon icon={faReply} className="text-success me-2 fa-flip-horizontal"/>
                                        <small className="text-success fw-bold">Instructor Replied:</small>
                                    </div>
                                    <p className="text-white-50 mb-0 small">{q.reply}</p>
                                </div>
                            ) : (
                                <div className="mt-auto text-end">
                                    <span className="badge bg-secondary text-white-50 rounded-pill fw-normal">Waiting for reply...</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )})}
          </AnimatePresence>
        </div>
        {!loading && questions.length === 0 && <p className="text-center text-white-50 mt-5">No questions yet.</p>}
      </div>
    </div>
  );
};
export default StudentQA;