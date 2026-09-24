import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faBullhorn, 
  faCode, 
  faUsers, 
  faUserGraduate, 
  faFileUpload, 
  faBookOpen, 
  faShieldAlt, 
  faChevronLeft, 
  faChevronRight,
  faComments,
  faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const SupervisorClassView = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 7;

  useEffect(() => {
    const fetchData = async () => {
      if (!classId || classId === ":classId") {
        setError("Invalid URL.");
        setLoading(false);
        return;
      }
      try {
        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);
        if (!classSnap.exists()) {
          setError("Class not found.");
          setLoading(false);
          return;
        }
        const data = classSnap.data();
        setClassData(data);

        if (data.enrolledStudents?.length > 0) {
          const students = [];
          for (const uid of data.enrolledStudents) {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) students.push({ id: userSnap.id, ...userSnap.data() });
          }
          setStudentList(students);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Error loading data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  // --- Handle Delete Class ---
  const handleDeleteClass = async () => {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete this class?\n\nThis action cannot be undone and will remove access for all enrolled students."
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "classes", classId));
      alert("Class deleted successfully.");
      navigate("/SupervisorDashboard");
    } catch (err) {
      console.error("Error deleting class:", err);
      alert("Failed to delete class. Please try again.");
      setDeleting(false);
    }
  };

  // Pagination Logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = studentList.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(studentList.length / studentsPerPage);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  if (loading) return <div className="d-flex min-vh-100 justify-content-center align-items-center bg-dark text-info"><div className="spinner-border"></div></div>;

  if (error) return (
    <div className="d-flex flex-column min-vh-100 justify-content-center align-items-center bg-dark text-white p-4">
      <h3 className="text-danger">{error}</h3>
      <button className="btn btn-outline-light mt-3" onClick={() => navigate('/SupervisorDashboard')}>Dashboard</button>
    </div>
  );

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#0f0c29", color: "#fff", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Header */}
      <header className="py-3 px-4 border-bottom border-secondary d-flex justify-content-between align-items-center bg-black bg-opacity-50 backdrop-blur sticky-top">
        <div className="d-flex align-items-center">
            <button onClick={() => navigate("/SupervisorDashboard")} className="btn btn-sm btn-outline-light rounded-pill px-3 me-3">
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Dashboard
            </button>
            <span className="text-white-50 border-start border-secondary ps-3">Class Management</span>
        </div>
        
        {/* Top Right Quick Delete Button (Optional depending on UI preference, keeping it in banner is usually safer) */}
      </header>

      <div className="container py-5">
        
        {/* Class Banner */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="p-5 mb-5 rounded-4 shadow-lg position-relative overflow-hidden text-center text-lg-start d-flex flex-column flex-lg-row align-items-center justify-content-between" 
            style={{ background: "linear-gradient(135deg, #1cb5e0 0%, #000851 100%)" }}
        >
            <div>
                <h1 className="display-5 fw-bold text-white mb-2">{classData?.name}</h1>
                <p className="lead text-info mb-4 text-white-50">{classData?.subject}</p>
                
                {/* Delete Class Button */}
                <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteClass}
                    disabled={deleting}
                    className="btn btn-danger btn-sm rounded-pill px-4 fw-bold shadow"
                >
                    {deleting ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Deleting...</>
                    ) : (
                        <><FontAwesomeIcon icon={faTrashAlt} className="me-2" /> Delete Class</>
                    )}
                </motion.button>
            </div>
            
            <div className="mt-4 mt-lg-0 text-center bg-black bg-opacity-25 p-4 rounded-4 border border-white border-opacity-10 backdrop-blur">
                <small className="text-uppercase text-white-50 d-block mb-2 fw-bold" style={{letterSpacing: '2px'}}>Class Join Code</small>
                <div className="h1 font-monospace text-info mb-0 text-shadow-glow">
                    {classData?.code}
                </div>
            </div>
        </motion.div>

        <div className="row g-5">
          
          {/* LEFT COLUMN: Student List */}
          <div className="col-lg-7">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="m-0 text-white"><FontAwesomeIcon icon={faUsers} className="me-2 text-info" /> Enrolled Students</h4>
                <span className="badge bg-secondary rounded-pill">{studentList.length} Total</span>
            </div>

            <div className="card border-0 shadow-lg overflow-hidden" style={{ background: "#1a1a1a", borderRadius: "12px" }}>
              <div className="card-body p-0">
                {studentList.length > 0 ? (
                  <>
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0 align-middle">
                        <thead className="text-uppercase small text-white-50" style={{ background: "#252525" }}>
                            <tr>
                                <th className="ps-4 py-3 fw-normal">Student Name</th>
                                <th className="py-3 fw-normal">Email Address</th>
                            </tr>
                        </thead>
                        <tbody>
                        {currentStudents.map((student) => (
                            <tr key={student.id} style={{ borderBottom: "1px solid #333" }}>
                            <td className="ps-4 py-3">
                                <div className="d-flex align-items-center">
                                    <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: 35, height: 35}}>
                                        <FontAwesomeIcon icon={faUserGraduate} size="sm" />
                                    </div>
                                    <span className="fw-semibold">{student.name}</span>
                                </div>
                            </td>
                            <td className="text-white-50 py-3">{student.email}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls */}
                  {studentList.length > studentsPerPage && (
                      <div className="d-flex justify-content-between align-items-center p-3 bg-dark border-top border-secondary">
                          <button 
                            onClick={prevPage} 
                            disabled={currentPage === 1} 
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                          >
                             <FontAwesomeIcon icon={faChevronLeft} className="me-1"/> Prev
                          </button>
                          <span className="text-white-50 small">Page {currentPage} of {totalPages}</span>
                          <button 
                            onClick={nextPage} 
                            disabled={currentPage === totalPages} 
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                          >
                             Next <FontAwesomeIcon icon={faChevronRight} className="ms-1"/>
                          </button>
                      </div>
                  )}
                  </>
                ) : (
                    <div className="p-5 text-center text-white-50">
                        <FontAwesomeIcon icon={faUserGraduate} className="display-4 mb-3 opacity-25"/>
                        <p className="mb-0">No students enrolled yet.</p>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Management Tools Grid */}
          <div className="col-lg-5">
            <h4 className="mb-3 text-white">Management Tools</h4>
            
            <div className="row g-3">
              {/* Announcements */}
              <div className="col-sm-6">
                <motion.button 
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/supervisor/class/${classId}/announcements`)}
                    className="btn border-0 w-100 p-4 rounded-4 text-start shadow-sm h-100 d-flex flex-column justify-content-between"
                    style={{ background: "linear-gradient(45deg, #FF9966, #FF5E62)" }}
                >
                    <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 45, height: 45}}>
                        <FontAwesomeIcon icon={faBullhorn} className="text-white fs-4" />
                    </div>
                    <div className="text-white">
                        <h6 className="fw-bold mb-1">Announcements</h6>
                        <small className="opacity-75" style={{fontSize: '0.75rem'}}>Post updates</small>
                    </div>
                </motion.button>
              </div>

              {/* Assignments */}
              <div className="col-sm-6">
                <motion.button 
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/supervisor/class/${classId}/assignments`)}
                    className="btn border-0 w-100 p-4 rounded-4 text-start shadow-sm h-100 d-flex flex-column justify-content-between"
                    style={{ background: "linear-gradient(45deg, #56CCF2, #2F80ED)" }}
                >
                    <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 45, height: 45}}>
                        <FontAwesomeIcon icon={faFileUpload} className="text-white fs-4" />
                    </div>
                    <div className="text-white">
                        <h6 className="fw-bold mb-1">Assignments</h6>
                        <small className="opacity-75" style={{fontSize: '0.75rem'}}>Tasks & grades</small>
                    </div>
                </motion.button>
              </div>

              {/* Materials */}
              <div className="col-sm-6">
                <motion.button 
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/supervisor/class/${classId}/materials`)}
                    className="btn border-0 w-100 p-4 rounded-4 text-start shadow-sm h-100 d-flex flex-column justify-content-between"
                    style={{ background: "linear-gradient(45deg, #11998e, #38ef7d)" }}
                >
                    <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 45, height: 45}}>
                        <FontAwesomeIcon icon={faBookOpen} className="text-white fs-4" />
                    </div>
                    <div className="text-white">
                        <h6 className="fw-bold mb-1">Materials</h6>
                        <small className="opacity-75" style={{fontSize: '0.75rem'}}>PDFs & Slides</small>
                    </div>
                </motion.button>
              </div>

              {/* Q&A Forum */}
              <div className="col-sm-6">
                <motion.button 
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/supervisor/class/${classId}/qa`)}
                    className="btn border-0 w-100 p-4 rounded-4 text-start shadow-sm h-100 d-flex flex-column justify-content-between"
                    style={{ background: "linear-gradient(45deg, #F2994A, #F2C94C)" }}
                >
                    <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 45, height: 45}}>
                        <FontAwesomeIcon icon={faComments} className="text-white fs-4" />
                    </div>
                    <div className="text-white">
                        <h6 className="fw-bold mb-1">Student Q&A</h6>
                        <small className="opacity-75" style={{fontSize: '0.75rem'}}>Reply to queries</small>
                    </div>
                </motion.button>
              </div>

              {/* AI Compiler */}
              <div className="col-sm-6">
                <motion.button 
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/supervisor/class/${classId}/compiler`)}
                    className="btn border-0 w-100 p-4 rounded-4 text-start shadow-sm h-100 d-flex flex-column justify-content-between"
                    style={{ background: "linear-gradient(45deg, #8E2DE2, #4A00E0)" }}
                >
                    <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 45, height: 45}}>
                        <FontAwesomeIcon icon={faCode} className="text-white fs-4" />
                    </div>
                    <div className="text-white">
                        <h6 className="fw-bold mb-1">AI Compiler</h6>
                        <small className="opacity-75" style={{fontSize: '0.75rem'}}>Run & debug code</small>
                    </div>
                </motion.button>
              </div>

              {/* Plagiarism Checker */}
              <div className="col-sm-6">
                <motion.button 
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/supervisor/class/${classId}/plagiarism`)}
                    className="btn border-0 w-100 p-4 rounded-4 text-start shadow-sm h-100 d-flex flex-column justify-content-between"
                    style={{ background: "linear-gradient(45deg, #EB3349, #F45C43)" }}
                >
                    <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 45, height: 45}}>
                        <FontAwesomeIcon icon={faShieldAlt} className="text-white fs-4" />
                    </div>
                    <div className="text-white">
                        <h6 className="fw-bold mb-1">Plagiarism AI</h6>
                        <small className="opacity-75" style={{fontSize: '0.75rem'}}>Scan & Detect</small>
                    </div>
                </motion.button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SupervisorClassView;