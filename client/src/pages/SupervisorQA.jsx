import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faComments, faReply, faTrash, faCheckCircle, faSpinner, faPen } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const SupervisorQA = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    const q = query(collection(db, `classes/${classId}/questions`), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [classId]);

  const handleReplyChange = (id, text) => {
      setReplyText(prev => ({ ...prev, [id]: text }));
  };

  const submitReply = async (qId) => {
      if (!replyText[qId]?.trim()) return;
      setSubmitting(qId);
      try {
          await updateDoc(doc(db, `classes/${classId}/questions`, qId), {
              reply: replyText[qId],
              replyDate: serverTimestamp()
          });
          setReplyText(prev => ({ ...prev, [qId]: "" }));
      } catch (err) {
          alert("Failed to send reply");
      } finally {
          setSubmitting(null);
      }
  };

  const handleDelete = async (qId) => {
      if(!window.confirm("Delete this question?")) return;
      await deleteDoc(doc(db, `classes/${classId}/questions`, qId));
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#0f0c29", color: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      
      <header className="py-3 px-4 border-bottom border-secondary bg-black bg-opacity-50 backdrop-blur sticky-top">
        <div className="container d-flex align-items-center">
            <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-light rounded-pill px-3 me-3">
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
            </button>
            <h5 className="m-0 fw-bold text-white">Student Questions</h5>
        </div>
      </header>

      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold text-white"><FontAwesomeIcon icon={faComments} className="text-warning me-3"/> Inbox</h2>
            <span className="badge bg-dark border border-secondary p-2">{questions.length} Total</span>
        </div>

        <div className="row g-4">
          <AnimatePresence>
            {questions.map((q) => (
                <div key={q.id} className="col-md-6 col-lg-4">
                    <motion.div 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card border-0 shadow-sm h-100 d-flex flex-column"
                        style={{ background: "#1a1a1a", borderRadius: "12px", borderTop: q.reply ? "4px solid #198754" : "4px solid #ffc107" }}
                    >
                        <div className="card-body p-4 d-flex flex-column">
                            {/* Header */}
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h6 className="fw-bold text-info mb-1">{q.studentName}</h6>
                                    <small className="text-white-50" style={{fontSize: '0.7rem'}}>
                                        {q.createdAt?.seconds ? new Date(q.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                                    </small>
                                </div>
                                <button onClick={() => handleDelete(q.id)} className="btn btn-sm btn-outline-danger border-0"><FontAwesomeIcon icon={faTrash}/></button>
                            </div>

                            <p className="text-white mb-3 flex-grow-1" style={{fontSize: '0.95rem'}}>{q.text}</p>

                            {/* Reply Area */}
                            {q.reply ? (
                                <div className="mt-auto bg-success bg-opacity-10 p-3 rounded border border-success border-opacity-25">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <h6 className="text-success fw-bold mb-0 small"><FontAwesomeIcon icon={faCheckCircle} className="me-1"/> Replied</h6>
                                        <button className="btn btn-link btn-sm text-white-50 p-0" onClick={() => updateDoc(doc(db, `classes/${classId}/questions`, q.id), { reply: "" })}>
                                            <FontAwesomeIcon icon={faPen} size="xs"/>
                                        </button>
                                    </div>
                                    <p className="text-light mb-0 small text-truncate">{q.reply}</p>
                                </div>
                            ) : (
                                <div className="mt-auto">
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm bg-dark text-white border-secondary" 
                                            placeholder="Reply..." 
                                            value={replyText[q.id] || ""}
                                            onChange={(e) => handleReplyChange(q.id, e.target.value)}
                                        />
                                        <button onClick={() => submitReply(q.id)} disabled={submitting === q.id || !replyText[q.id]} className="btn btn-sm btn-warning">
                                            {submitting === q.id ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faReply}/>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            ))}
          </AnimatePresence>
        </div>
        {questions.length === 0 && <div className="text-center text-white-50 py-5">No questions found.</div>}
      </div>
    </div>
  );
};
export default SupervisorQA;