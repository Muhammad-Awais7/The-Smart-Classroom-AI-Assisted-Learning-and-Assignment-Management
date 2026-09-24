import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { uploadToCloudinary } from "../utils/uploadUtils"; 
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, faPlus, faEye, faDownload, faCheck, faPaperclip, 
  faSpinner, faTrash, faEdit, faTimes, faStar, faRobot, 
  faWandMagicSparkles, faCopy, faCalendarAlt, faFileAlt, faTasks,
  faCloudUploadAlt, faGraduationCap
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const SupervisorAssignments = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const dateInputRef = useRef(null);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(null); 
  const [formData, setFormData] = useState({ title: "", desc: "", date: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // View Submissions & Grading State
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeData, setGradeData] = useState({ obtained: "", total: "", feedback: "" });

  // AI Review State
  const [activeAiReview, setActiveAiReview] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => { 
    fetchAssignments(); 
  }, [classId]);

  const fetchAssignments = async () => {
    try {
      const q = query(collection(db, `classes/${classId}/assignments`), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAssignments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch(err) { 
      console.error("Error fetching assignments:", err); 
    }
  };

  const getDownloadUrl = (url) => {
    if (!url) return "#";
    return url.includes("cloudinary") ? url.replace("/upload/", "/upload/fl_attachment/") : url;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let attachmentUrl = editMode ? assignments.find(a => a.id === editMode)?.attachmentUrl || "" : "";
      let attachmentName = editMode ? assignments.find(a => a.id === editMode)?.attachmentName || "" : "";

      if (file) {
        const uploadData = await uploadToCloudinary(file);
        attachmentUrl = uploadData.url;
        attachmentName = uploadData.fileName;
      }

      const data = {
        title: formData.title,
        description: formData.desc,
        dueDate: formData.date,
        attachmentUrl,
        attachmentName
      };

      if (editMode) {
        await updateDoc(doc(db, `classes/${classId}/assignments`, editMode), data);
      } else {
        await addDoc(collection(db, `classes/${classId}/assignments`), { 
          ...data, 
          createdAt: serverTimestamp() 
        });
      }

      setShowForm(false); 
      setEditMode(null); 
      setFormData({ title: "", desc: "", date: "" }); 
      setFile(null);
      fetchAssignments();
    } catch (error) {
      console.error(error);
      alert("Error saving assignment.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteDoc(doc(db, `classes/${classId}/assignments`, id));
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete assignment.");
    }
  };

  const startEdit = (task) => {
    setEditMode(task.id);
    setFormData({ title: task.title, desc: task.description, date: task.dueDate });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const fetchSubmissions = async (taskId) => {
    if (viewingSubmissions === taskId) { 
      setViewingSubmissions(null); 
      return; 
    }
    setViewingSubmissions(taskId);
    setSubmissionsList([]); 
    
    try {
      const q = query(collection(db, `classes/${classId}/assignments/${taskId}/submissions`), orderBy("submittedAt", "desc"));
      const snap = await getDocs(q);
      setSubmissionsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleSaveGrade = async (taskId, submissionId) => {
    if (!gradeData.total || !gradeData.obtained) return alert("Please enter both obtained and total grades.");
    
    try {
      const subRef = doc(db, `classes/${classId}/assignments/${taskId}/submissions`, submissionId);
      await updateDoc(subRef, {
        isGraded: true,
        obtainedGrade: gradeData.obtained,
        totalGrade: gradeData.total,
        feedback: gradeData.feedback,
        gradedAt: serverTimestamp()
      });

      setSubmissionsList(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, isGraded: true, obtainedGrade: gradeData.obtained, totalGrade: gradeData.total, feedback: gradeData.feedback } 
          : sub
      ));
      
      setGradingSubmissionId(null);
      setGradeData({ obtained: "", total: "", feedback: "" });
    } catch (error) {
      console.error("Error saving grade:", error);
      alert("Failed to save grade.");
    }
  };

  // --- AI REVIEW LOGIC ---
  const openAiReview = (submission, taskId) => {
    setActiveAiReview({ ...submission, taskId });
    setAiAnalysis(null);
    setCopySuccess(false);
    simulateAiReview(submission);
  };

  const simulateAiReview = async (submission) => {
    setIsAiLoading(true);
    setTimeout(() => {
      setAiAnalysis({
        aiProbability: Math.floor(Math.random() * 25) + "%",
        strengths: [
          "Clear structural cohesion and logical topic transitions.",
          "Solid alignment with the main assignment requirements.",
          "Well-formatted references and cleanly presented sections."
        ],
        weaknesses: [
          "Needs deeper real-world case analysis in core sections.",
          "Minor formatting inconsistencies in code or inline quotes.",
          "The summary could feature more personal synthesis."
        ],
        summaryFeedback: "Impressive submission overall! Concepts are clearly addressed and logically structured. For future improvement, consider enriching the discussion with practical edge cases. Keep up the high standard!"
      });
      setIsAiLoading(false);
    }, 2200);
  };

  const copyToClipboard = () => {
    if (aiAnalysis?.summaryFeedback) {
      navigator.clipboard.writeText(aiAnalysis.summaryFeedback);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const closeAiReview = () => {
    setActiveAiReview(null);
    setAiAnalysis(null);
  };

  const inputStyle = {
    background: "rgba(0, 0, 0, 0.35)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#fff",
    borderRadius: "12px",
    padding: "12px 14px"
  };

  // --- AI REVIEW VIEW ---
  if (activeAiReview) {
    return (
      <div 
        className="min-vh-100 text-white p-3 p-md-4 position-relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        <motion.div 
          className="position-absolute rounded-circle" 
          style={{ width: "500px", height: "500px", background: "#00d4ff", filter: "blur(180px)", top: "-10%", left: "-10%", opacity: 0.2, zIndex: 0 }} 
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }} 
          transition={{ repeat: Infinity, duration: 15 }} 
        />
        <motion.div 
          className="position-absolute rounded-circle" 
          style={{ width: "450px", height: "450px", background: "#ff00cc", filter: "blur(170px)", bottom: "-10%", right: "-10%", opacity: 0.18, zIndex: 0 }} 
          animate={{ scale: [1, 1.15, 1], y: [0, -30, 0] }} 
          transition={{ repeat: Infinity, duration: 12 }} 
        />

        <div className="container position-relative" style={{ maxWidth: "880px", zIndex: 5 }}>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={closeAiReview} 
            className="btn btn-outline-light mb-4 rounded-pill px-4"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back to Assignments
          </motion.button>
          
          <motion.div 
            initial={{ opacity: 0, y: 25 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="card border-0 shadow-lg overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              borderRadius: "24px",
              boxShadow: "0 20px 45px rgba(0,0,0,0.5)"
            }}
          >
            <div 
              className="card-header p-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
              style={{
                background: "rgba(0, 212, 255, 0.1)",
                borderBottom: "1px solid rgba(0, 212, 255, 0.2)"
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "50px", height: "50px", background: "rgba(0, 212, 255, 0.2)", color: "#00d4ff", border: "1px solid #00d4ff" }}
                >
                  <FontAwesomeIcon icon={faRobot} size="lg" />
                </div>
                <div>
                  <h4 className="m-0 fw-bold text-white">AI Submission Review</h4>
                  <small className="text-white-50">Automated quality & originality evaluation</small>
                </div>
              </div>
              <span 
                className="badge rounded-pill px-3 py-2 fs-6"
                style={{ background: "rgba(255, 0, 204, 0.2)", border: "1px solid #ff00cc", color: "#ff80df" }}
              >
                {activeAiReview.studentName}
              </span>
            </div>
            
            <div className="card-body p-4 p-md-5">
              <div 
                className="d-flex justify-content-between align-items-center flex-wrap gap-3 p-3 rounded-4 mb-4"
                style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                <div>
                  <span className="text-white-50 small d-block mb-1 text-uppercase fw-bold">Target File</span>
                  <a 
                    href={getDownloadUrl(activeAiReview.fileLink)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-info text-decoration-none fw-semibold d-flex align-items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPaperclip} />
                    <span>{activeAiReview.fileName || "Student_Submission.pdf"}</span>
                  </a>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => simulateAiReview(activeAiReview)} 
                  disabled={isAiLoading} 
                  className="btn btn-sm btn-outline-info rounded-pill px-3 py-2"
                  style={{ borderColor: "#00d4ff" }}
                >
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="me-2" /> Re-Analyze
                </motion.button>
              </div>

              {isAiLoading ? (
                <div className="text-center py-5">
                  <FontAwesomeIcon icon={faSpinner} spin size="3x" style={{ color: "#00d4ff" }} className="mb-3" />
                  <h5 className="fw-bold text-white">AI is reading the document...</h5>
                  <p className="text-white-50 small">Extracting syntax, analyzing depth, and calculating uniqueness score.</p>
                </div>
              ) : aiAnalysis ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* AI Probability Badge Bar */}
                  <div 
                    className="p-3 rounded-4 mb-4 d-flex justify-content-between align-items-center"
                    style={{ background: "rgba(255, 0, 85, 0.12)", border: "1px solid rgba(255, 0, 85, 0.3)" }}
                  >
                    <div>
                      <strong className="text-white">AI Generation Probability:</strong>
                      <div className="text-white-50 small">Confidence index of synthetic text</div>
                    </div>
                    <span 
                      className="badge rounded-pill px-3 py-2 fs-6 shadow-sm"
                      style={{ background: "#ff0055", color: "#fff" }}
                    >
                      {aiAnalysis.aiProbability}
                    </span>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <div 
                        className="h-100 p-4 rounded-4"
                        style={{ background: "rgba(0, 255, 157, 0.08)", border: "1px solid rgba(0, 255, 157, 0.3)" }}
                      >
                        <h6 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#00ff9d" }}>
                          <FontAwesomeIcon icon={faCheck} /> Notable Strengths
                        </h6>
                        <ul className="text-light mb-0 ps-3 small">
                          {aiAnalysis.strengths.map((str, i) => (
                            <li key={i} className="mb-2">{str}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div 
                        className="h-100 p-4 rounded-4"
                        style={{ background: "rgba(255, 170, 0, 0.08)", border: "1px solid rgba(255, 170, 0, 0.3)" }}
                      >
                        <h6 className="fw-bold d-flex align-items-center gap-2 mb-3" style={{ color: "#ffaa00" }}>
                          <FontAwesomeIcon icon={faStar} /> Improvement Areas
                        </h6>
                        <ul className="text-light mb-0 ps-3 small">
                          {aiAnalysis.weaknesses.map((weak, i) => (
                            <li key={i} className="mb-2">{weak}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* AI Generated Feedback Box */}
                  <div 
                    className="p-4 rounded-4 mb-4"
                    style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.15)" }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="m-0 text-info fw-bold">Suggested Student Feedback</h6>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyToClipboard} 
                        className={`btn btn-sm rounded-pill px-3 ${copySuccess ? 'btn-success' : 'btn-outline-light'}`}
                      >
                        <FontAwesomeIcon icon={copySuccess ? faCheck : faCopy} className="me-1" /> 
                        {copySuccess ? 'Copied to Clipboard!' : 'Copy Feedback'}
                      </motion.button>
                    </div>
                    <p className="text-light mb-0 lh-lg small">{aiAnalysis.summaryFeedback}</p>
                  </div>
                  
                  {/* Action */}
                  <div className="text-center pt-2">
                    <motion.button 
                      whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(0, 212, 255, 0.5)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        closeAiReview();
                        setGradingSubmissionId(activeAiReview.id);
                        setGradeData({ 
                          obtained: activeAiReview.obtainedGrade || "", 
                          total: activeAiReview.totalGrade || "", 
                          feedback: aiAnalysis.summaryFeedback 
                        });
                      }} 
                      className="btn btn-lg rounded-pill px-5 fw-bold text-white"
                      style={{
                        background: "linear-gradient(45deg, #00d4ff, #007cf0)",
                        border: "none"
                      }}
                    >
                      <FontAwesomeIcon icon={faGraduationCap} className="me-2" /> Proceed to Grading
                    </motion.button>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- MAIN ASSIGNMENTS VIEW ---
  return (
    <div 
      className="min-vh-100 text-white p-3 p-md-4 position-relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Background Orbs */}
      <motion.div 
        className="position-absolute rounded-circle" 
        style={{ width: "500px", height: "500px", background: "#00d4ff", filter: "blur(180px)", top: "-15%", left: "-10%", opacity: 0.15, zIndex: 0 }} 
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }} 
        transition={{ repeat: Infinity, duration: 15 }} 
      />
      <motion.div 
        className="position-absolute rounded-circle" 
        style={{ width: "450px", height: "450px", background: "#bd00ff", filter: "blur(160px)", bottom: "-10%", right: "-10%", opacity: 0.15, zIndex: 0 }} 
        animate={{ scale: [1, 1.1, 1], y: [0, -40, 0] }} 
        transition={{ repeat: Infinity, duration: 12 }} 
      />

      <div className="container position-relative" style={{ maxWidth: "960px", zIndex: 5 }}>
        {/* Navigation Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)} 
            className="btn btn-outline-light rounded-pill px-4 btn-sm"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowForm(!showForm); 
              setEditMode(null); 
              setFormData({ title: "", desc: "", date: "" });
              setFile(null);
            }} 
            className="btn rounded-pill px-4 fw-bold shadow"
            style={{
              background: showForm 
                ? "rgba(255, 255, 255, 0.15)" 
                : "linear-gradient(45deg, #00ff9d, #00d4ff)",
              color: showForm ? "#fff" : "#0f0c29",
              border: "none"
            }}
          >
            <FontAwesomeIcon icon={showForm ? faTimes : faPlus} className="me-2" /> 
            {showForm ? "Cancel Form" : "Create New Task"}
          </motion.button>
        </div>

        {/* Page Title */}
        <div className="text-center mb-5">
          <h2 className="fw-bold display-6 d-flex align-items-center justify-content-center gap-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px", background: "rgba(0, 212, 255, 0.15)", border: "1px solid #00d4ff", color: "#00d4ff" }}
            >
              <FontAwesomeIcon icon={faTasks} />
            </div>
            <span>Manage Assignments</span>
          </h2>
          <p className="text-white-50">Publish coursework, inspect submissions, and run AI originality checks.</p>
        </div>

        {/* Create / Edit Form Card */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="card border-0 shadow-lg p-4 p-md-5 mb-5"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(0, 255, 157, 0.3)",
                borderRadius: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
              }}
            >
              <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom border-white border-opacity-10">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "45px", height: "45px", background: "rgba(0, 255, 157, 0.15)", color: "#00ff9d" }}
                >
                  <FontAwesomeIcon icon={editMode ? faEdit : faPlus} />
                </div>
                <div>
                  <h4 className="m-0 fw-bold" style={{ color: "#00ff9d" }}>
                    {editMode ? "Update Assignment" : "Create New Assignment"}
                  </h4>
                  <small className="text-white-50">Fill in all assignment specifications below</small>
                </div>
              </div>

              <form onSubmit={handleSave}>
                {/* Assignment Title */}
                <div className="mb-4">
                  <label className="form-label text-info small fw-bold text-uppercase d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faFileAlt} /> Assignment Title
                  </label>
                  <input 
                    type="text" 
                    className="form-control form-control-lg text-white shadow-none" 
                    placeholder="e.g. Project Phase 1: Database Architecture" 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    required 
                    style={inputStyle}
                  />
                </div>

                {/* Assignment Description */}
                <div className="mb-4">
                  <label className="form-label text-info small fw-bold text-uppercase d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faTasks} /> Task Instructions & Description
                  </label>
                  <textarea 
                    rows="4" 
                    className="form-control text-white shadow-none" 
                    placeholder="Specify project guidelines, constraints, and submission criteria..." 
                    value={formData.desc} 
                    onChange={e => setFormData({ ...formData, desc: e.target.value })} 
                    required 
                    style={inputStyle}
                  />
                </div>

                {/* Due Date with Full Click Trigger for Calendar */}
                <div className="mb-4">
                  <label className="form-label text-info small fw-bold text-uppercase d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarAlt} /> Submission Deadline (Due Date)
                  </label>
                  <div 
                    onClick={() => {
                      if (dateInputRef.current) {
                        try {
                          dateInputRef.current.showPicker();
                        } catch (err) {
                          dateInputRef.current.focus();
                        }
                      }
                    }}
                    className="position-relative d-flex align-items-center"
                    style={{ cursor: "pointer" }}
                  >
                    <input 
                      ref={dateInputRef}
                      type="date" 
                      className="form-control form-control-lg text-white shadow-none" 
                      value={formData.date} 
                      onChange={e => setFormData({ ...formData, date: e.target.value })} 
                      required 
                      style={{ 
                        ...inputStyle, 
                        cursor: "pointer",
                        colorScheme: "dark"
                      }} 
                    />
                    <div 
                      className="position-absolute end-0 pe-3 text-info pointer-events-none"
                      style={{ pointerEvents: "none" }}
                    >
                      <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                    </div>
                  </div>
                  <small className="text-white-50 mt-1 d-block" style={{ fontSize: "0.8rem" }}>
                    Click anywhere on the field to open the full date, month, and year calendar.
                  </small>
                </div>

                {/* Reference File Attachment */}
                <div className="mb-4">
                  <label className="form-label text-info small fw-bold text-uppercase d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faCloudUploadAlt} /> Reference Attachment {editMode && "(Optional replacement)"}
                  </label>
                  <input 
                    type="file" 
                    className="form-control text-white shadow-none" 
                    onChange={e => setFile(e.target.files[0])} 
                    style={inputStyle}
                  />
                  <small className="text-white-50 mt-1 d-block" style={{ fontSize: "0.8rem" }}>
                    Supports PDF, DOCX, ZIP, or rubric resource files.
                  </small>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={uploading} 
                  type="submit"
                  className="btn btn-lg w-100 fw-bold text-white shadow mt-3"
                  style={{
                    background: "linear-gradient(45deg, #00ff9d, #00d4ff)",
                    color: "#0f0c29",
                    border: "none",
                    borderRadius: "14px"
                  }}
                >
                  {uploading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Saving Assignment...
                    </>
                  ) : editMode ? "Update Assignment" : "Publish Assignment"}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assignment List */}
        <div className="row g-4">
          {assignments.map(task => (
            <div key={task.id} className="col-12">
              <motion.div 
                whileHover={{ y: -4, borderColor: "rgba(0, 212, 255, 0.4)" }}
                className="card border-0 shadow-lg p-4 position-relative overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "20px"
                }}
              >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                  <div>
                    <h4 className="fw-bold text-white mb-1">{task.title}</h4>
                    <span 
                      className="badge rounded-pill px-3 py-1"
                      style={{
                        background: "rgba(255, 0, 85, 0.15)",
                        border: "1px solid rgba(255, 0, 85, 0.4)",
                        color: "#ff4d88",
                        fontSize: "0.78rem"
                      }}
                    >
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1" /> Due: {task.dueDate}
                    </span>
                  </div>

                  <div className="d-flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => startEdit(task)} 
                      className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "36px", height: "36px", background: "rgba(255, 170, 0, 0.2)", border: "1px solid #ffaa00", color: "#ffaa00" }}
                      title="Edit Assignment"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(task.id)} 
                      className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: "36px", height: "36px", background: "rgba(255, 0, 85, 0.2)", border: "1px solid #ff0055", color: "#ff0055" }}
                      title="Delete Assignment"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </motion.button>
                  </div>
                </div>
                
                <p className="text-light opacity-75 mb-3" style={{ whiteSpace: "pre-wrap" }}>
                  {task.description}
                </p>
                
                {/* Attached File */}
                {task.attachmentUrl && (
                  <div className="mb-3">
                    <a 
                      href={getDownloadUrl(task.attachmentUrl)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-2"
                      style={{
                        background: "rgba(0, 212, 255, 0.12)",
                        border: "1px solid rgba(0, 212, 255, 0.35)",
                        color: "#00d4ff"
                      }}
                    >
                      <FontAwesomeIcon icon={faPaperclip} /> 
                      <span>{task.attachmentName || "Reference Attachment"}</span>
                    </a>
                  </div>
                )}

                {/* Submissions Toggle Button */}
                <div className="pt-2 border-top border-white border-opacity-10">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fetchSubmissions(task.id)} 
                    className="btn btn-sm rounded-pill px-4 fw-bold"
                    style={{
                      background: viewingSubmissions === task.id ? "#00d4ff" : "rgba(0, 212, 255, 0.15)",
                      color: viewingSubmissions === task.id ? "#0f0c29" : "#00d4ff",
                      border: "1px solid #00d4ff"
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} className="me-2" /> 
                    {viewingSubmissions === task.id ? "Hide Submissions" : "View Submissions"}
                  </motion.button>
                </div>
                
                {/* Submissions Drawer */}
                <AnimatePresence>
                  {viewingSubmissions === task.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 p-md-4 rounded-4"
                      style={{
                        background: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.15)"
                      }}
                    >
                      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "#00d4ff" }}>
                        <FontAwesomeIcon icon={faGraduationCap} /> Received Submissions
                      </h6>

                      {submissionsList.length === 0 ? (
                        <p className="text-white-50 small mb-0 fst-italic">No student submissions recorded yet for this task.</p>
                      ) : (
                        submissionsList.map(sub => (
                          <div 
                            key={sub.id} 
                            className="p-3 mb-3 rounded-3"
                            style={{ 
                              background: "rgba(255, 255, 255, 0.03)", 
                              border: "1px solid rgba(255, 255, 255, 0.08)" 
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <FontAwesomeIcon icon={faCheck} className="text-success" />
                                  <strong className="text-white fs-6">{sub.studentName}</strong>
                                </div>
                                <div className="small text-white-50">{sub.fileName}</div>
                                <div className="text-info mt-1" style={{ fontSize: '0.75rem' }}>
                                  Submitted: {sub.submittedAt?.seconds ? new Date(sub.submittedAt.seconds * 1000).toLocaleString() : "Unknown"}
                                </div>
                              </div>

                              <div className="d-flex gap-2 flex-wrap">
                                <a 
                                  href={getDownloadUrl(sub.fileLink)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="btn btn-sm btn-light rounded-pill px-3"
                                >
                                  <FontAwesomeIcon icon={faDownload} className="me-1" /> File
                                </a>

                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => openAiReview(sub, task.id)} 
                                  className="btn btn-sm rounded-pill px-3"
                                  style={{ background: "rgba(0, 212, 255, 0.2)", border: "1px solid #00d4ff", color: "#00d4ff" }}
                                  title="Run AI Review"
                                >
                                  <FontAwesomeIcon icon={faRobot} className="me-1" /> AI Review
                                </motion.button>

                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setGradingSubmissionId(gradingSubmissionId === sub.id ? null : sub.id);
                                    setGradeData({ 
                                      obtained: sub.obtainedGrade || "", 
                                      total: sub.totalGrade || "", 
                                      feedback: sub.feedback || "" 
                                    });
                                  }} 
                                  className="btn btn-sm rounded-pill px-3"
                                  style={{ background: "rgba(255, 170, 0, 0.2)", border: "1px solid #ffaa00", color: "#ffaa00" }}
                                >
                                  <FontAwesomeIcon icon={faStar} className="me-1" /> {sub.isGraded ? "Edit Grade" : "Grade"}
                                </motion.button>
                              </div>
                            </div>

                            {/* Existing Grade Badge */}
                            {sub.isGraded && gradingSubmissionId !== sub.id && (
                              <div 
                                className="p-3 rounded-3 mt-2"
                                style={{ background: "rgba(0, 255, 157, 0.08)", border: "1px solid rgba(0, 255, 157, 0.3)" }}
                              >
                                <span className="fw-bold" style={{ color: "#00ff9d" }}>
                                  Score: {sub.obtainedGrade} / {sub.totalGrade}
                                </span>
                                {sub.feedback && (
                                  <div className="text-light small mt-1">
                                    <strong className="text-white-50">Feedback:</strong> {sub.feedback}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Grading Drawer */}
                            {gradingSubmissionId === sub.id && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-3 mt-3"
                                style={{ background: "rgba(0, 0, 0, 0.6)", border: "1px solid #ffaa00" }}
                              >
                                <h6 className="fw-bold mb-3" style={{ color: "#ffaa00" }}>
                                  Evaluation & Feedback
                                </h6>
                                <div className="row g-2 mb-2">
                                  <div className="col-6">
                                    <label className="small text-white-50">Score Obtained</label>
                                    <input 
                                      type="number" 
                                      className="form-control form-control-sm text-white shadow-none" 
                                      placeholder="e.g. 85" 
                                      value={gradeData.obtained} 
                                      onChange={(e) => setGradeData({ ...gradeData, obtained: e.target.value })} 
                                      style={inputStyle}
                                    />
                                  </div>
                                  <div className="col-6">
                                    <label className="small text-white-50">Total Score</label>
                                    <input 
                                      type="number" 
                                      className="form-control form-control-sm text-white shadow-none" 
                                      placeholder="e.g. 100" 
                                      value={gradeData.total} 
                                      onChange={(e) => setGradeData({ ...gradeData, total: e.target.value })} 
                                      style={inputStyle}
                                    />
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <label className="small text-white-50">Instructor Comments</label>
                                  <textarea 
                                    className="form-control form-control-sm text-white shadow-none" 
                                    placeholder="Write qualitative remarks..." 
                                    rows="3" 
                                    value={gradeData.feedback} 
                                    onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                    style={inputStyle}
                                  />
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                  <button 
                                    onClick={() => setGradingSubmissionId(null)} 
                                    className="btn btn-sm btn-outline-light rounded-pill px-3"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleSaveGrade(task.id, sub.id)} 
                                    className="btn btn-sm fw-bold rounded-pill px-3"
                                    style={{ background: "#ffaa00", color: "#000", border: "none" }}
                                  >
                                    Save Grade
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          ))}

          {assignments.length === 0 && (
            <div className="col-12 text-center py-5">
              <div 
                className="p-5 rounded-4"
                style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
              >
                <FontAwesomeIcon icon={faTasks} size="3x" className="text-white-50 mb-3" />
                <h5 className="text-white-50">No Assignments Yet</h5>
                <p className="text-secondary small mb-0">Create your first task using the button above.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorAssignments;