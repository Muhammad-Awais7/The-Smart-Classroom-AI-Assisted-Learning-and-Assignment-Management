import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/uploadUtils"; 
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faLaptopCode, 
  faFileUpload, 
  faCalendarAlt, 
  faSpinner, 
  faPaperclip, 
  faBan, 
  faCheckCircle, 
  faCircle, 
  faCheck,
  faClipboardCheck,
  faAward
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const StudentAssignments = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  // Submission State
  const [selectedTask, setSelectedTask] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Local "Mark as Done" State
  const [doneTasks, setDoneTasks] = useState(() => {
      const saved = localStorage.getItem(`done_tasks_${classId}`);
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  const fetchAssignments = async () => {
    try {
        const user = auth.currentUser;
        
        // Fetch all assignments for the class
        const q = query(collection(db, `classes/${classId}/assignments`), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssignments(fetchedTasks);

        // If user is logged in, fetch their specific submissions to check for grades
        if (user) {
            const userSubmissions = {};
            await Promise.all(fetchedTasks.map(async (task) => {
                const subQ = query(
                    collection(db, `classes/${classId}/assignments/${task.id}/submissions`),
                    where("studentId", "==", user.uid)
                );
                const subSnap = await getDocs(subQ);
                if (!subSnap.empty) {
                    // Store the actual submission document data
                    userSubmissions[task.id] = subSnap.docs[0].data();
                }
            }));
            setMySubmissions(userSubmissions);
        }
    } catch (err) {
        console.error("Error fetching assignments:", err);
    } finally {
        setLoading(false);
    }
  };

  const getDownloadUrl = (url) => {
      if (!url) return "#";
      return url.replace("/upload/", "/upload/fl_attachment/");
  };

  const handleSubmit = async () => {
    if (!file || !selectedTask) return alert("Please select a file.");
    setUploading(true);

    try {
      const user = auth.currentUser;
      const uploadData = await uploadToCloudinary(file);

      // Save Submission
      const submissionData = {
        studentId: user.uid, 
        studentName: user.displayName || "Student", 
        fileLink: uploadData.url, 
        fileName: file.name,
        submittedAt: serverTimestamp(),
        isGraded: false
      };

      await addDoc(collection(db, `classes/${classId}/assignments/${selectedTask}/submissions`), submissionData);

      // Update Local State so UI updates immediately
      setMySubmissions(prev => ({...prev, [selectedTask]: submissionData}));

      alert("Assignment Submitted Successfully!");
      setSelectedTask(null); 
      setFile(null);
      
      if (!doneTasks.includes(selectedTask)) toggleDone(selectedTask);

    } catch (error) {
      console.error(error);
      alert("Error submitting assignment.");
    } finally {
      setUploading(false);
    }
  };

  const toggleDone = (taskId) => {
      let newDone;
      if (doneTasks.includes(taskId)) {
          newDone = doneTasks.filter(id => id !== taskId);
      } else {
          newDone = [...doneTasks, taskId];
      }
      setDoneTasks(newDone);
      localStorage.setItem(`done_tasks_${classId}`, JSON.stringify(newDone));
  };

  const isOverdue = (dueDate) => {
      if (!dueDate) return false;
      const due = new Date(dueDate);
      const now = new Date();
      return now > due.setHours(23, 59, 59, 999);
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#0f0c29", color: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      
      <header className="py-3 px-4 border-bottom border-white border-opacity-10 bg-black bg-opacity-50 backdrop-blur sticky-top">
        <div className="container d-flex align-items-center justify-content-between">
            <h4 className="m-0 fw-bold text-white"><FontAwesomeIcon icon={faLaptopCode} className="text-info me-2"/> Assignments</h4>
            <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-light rounded-pill px-3">
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
            </button>
        </div>
      </header>

      <div className="container py-5" style={{maxWidth: "1000px"}}>
         
         {loading ? (
             <div className="text-center py-5">
                 <div className="spinner-border text-info" role="status"></div>
                 <p className="mt-3 text-white-50">Loading assignments...</p>
             </div>
         ) : (
             <AnimatePresence>
                {assignments.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-center py-5"
                    >
                        <div className="bg-dark d-inline-block p-5 rounded-circle mb-4 shadow-lg border border-secondary border-opacity-25">
                            <FontAwesomeIcon icon={faClipboardCheck} className="text-white-50 display-1" />
                        </div>
                        <h2 className="fw-bold text-white mb-2">No Assignments Yet</h2>
                        <p className="text-white-50 fs-5">You're all caught up! Check back later for new tasks.</p>
                    </motion.div>
                ) : (
                    <div className="row g-4">
                        {assignments.map((task, index) => {
                           const overdue = isOverdue(task.dueDate);
                           const isDone = doneTasks.includes(task.id);
                           const submission = mySubmissions[task.id]; 
                           const isSubmitted = !!submission;

                           return (
                           <motion.div 
                                key={task.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="col-md-6"
                           >
                              <div className={`card h-100 border-0 shadow-lg ${isDone ? "border-success" : ""}`} 
                                   style={{ 
                                       background: "linear-gradient(145deg, #1a1a1a, #222)", 
                                       borderRadius: "16px",
                                       border: isDone ? "1px solid #198754" : "1px solid rgba(255,255,255,0.1)"
                                   }}>
                                  <div className="card-body p-4 d-flex flex-column">
                                     <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="text-white fw-bold mb-0 text-break">{task.title}</h5>
                                        
                                        <div className="d-flex align-items-center ms-2">
                                            <button onClick={() => toggleDone(task.id)} className="btn btn-link p-0 me-2" title={isDone ? "Mark as Not Done" : "Mark as Done"}>
                                                <FontAwesomeIcon icon={isDone ? faCheckCircle : faCircle} className={isDone ? "text-success fs-4" : "text-secondary fs-4"} />
                                            </button>
                                            <span className={`badge ${overdue ? "bg-secondary" : "bg-danger"}`}>
                                                <FontAwesomeIcon icon={faCalendarAlt} className="me-1"/> {task.dueDate}
                                            </span>
                                        </div>
                                     </div>

                                     <p className="text-white-50 flex-grow-1 mb-4" style={{whiteSpace: 'pre-wrap'}}>{task.description}</p>
                                     
                                     {task.attachmentUrl && (
                                        <a href={getDownloadUrl(task.attachmentUrl)} className="btn btn-sm btn-outline-light mb-3 text-start w-100 border-secondary text-white-50">
                                            <FontAwesomeIcon icon={faPaperclip} className="me-2"/> Reference Material
                                        </a>
                                     )}

                                     {/* Feedback & Grades Display */}
                                     {isSubmitted && submission.isGraded && (
                                        <div className="bg-success bg-opacity-10 border border-success rounded p-3 mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <strong className="text-success"><FontAwesomeIcon icon={faAward} className="me-2"/>Grade</strong>
                                                <span className="badge bg-success fs-6">{submission.obtainedGrade} / {submission.totalGrade}</span>
                                            </div>
                                            {submission.feedback && (
                                                <p className="mb-0 mt-2 text-light small border-top border-success border-opacity-25 pt-2">
                                                    <strong>Feedback:</strong> {submission.feedback}
                                                </p>
                                            )}
                                        </div>
                                     )}

                                     <div className="mt-auto">
                                         {selectedTask === task.id ? (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: "auto", opacity: 1 }}
                                                className="p-3 bg-black bg-opacity-50 border border-info rounded-3"
                                            >
                                                <label className="small text-info mb-2 fw-bold">Upload Your Work</label>
                                                <input type="file" className="form-control form-control-sm bg-dark text-white border-secondary mb-3" onChange={e => setFile(e.target.files[0])} />
                                                
                                                <div className="d-flex gap-2">
                                                    <button onClick={handleSubmit} disabled={uploading} className="btn btn-sm btn-info fw-bold w-100 text-white">
                                                        {uploading ? <><FontAwesomeIcon icon={faSpinner} spin /> Uploading...</> : "Submit Assignment"}
                                                    </button>
                                                    <button onClick={() => {setSelectedTask(null); setFile(null);}} className="btn btn-sm btn-outline-secondary">Cancel</button>
                                                </div>
                                            </motion.div>
                                         ) : (
                                            <div>
                                                 {isSubmitted && <div className="text-success small mb-2 text-center"><FontAwesomeIcon icon={faCheck} /> Assignment Submitted</div>}
                                                 
                                                 <button 
                                                    onClick={() => setSelectedTask(task.id)} 
                                                    disabled={overdue}
                                                    className={`btn w-100 fw-bold rounded-pill shadow-sm ${overdue ? "btn-secondary" : isDone ? "btn-outline-success" : "btn-primary"}`}
                                                    style={!overdue && !isDone ? { background: "linear-gradient(45deg, #0d6efd, #0dcaf0)", border: "none" } : {}}
                                                 >
                                                    {overdue ? <><FontAwesomeIcon icon={faBan} className="me-2"/> Deadline Passed</> : <><FontAwesomeIcon icon={faFileUpload} className="me-2"/> {isSubmitted ? "Submit Again" : "Submit Work"}</>}
                                                 </button>
                                            </div>
                                         )}
                                     </div>
                                  </div>
                              </div>
                           </motion.div>
                        )})}
                    </div>
                )}
             </AnimatePresence>
         )}
      </div>
    </div>
  );
};

export default StudentAssignments;