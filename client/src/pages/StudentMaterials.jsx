import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBookOpen, faFilePdf, faCheckCircle, faCircle, faDownload, faFileCode, faFileImage } from "@fortawesome/free-solid-svg-icons";

const StudentMaterials = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [materials, setMaterials] = useState([]);
  
  // Load read status from LocalStorage
  const [readItems, setReadItems] = useState(() => {
      const saved = localStorage.getItem(`read_${classId}`);
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchMaterials = async () => {
      const q = query(collection(db, `classes/${classId}/materials`), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchMaterials();
  }, [classId]);

  const toggleRead = (id) => {
      let newRead;
      if (readItems.includes(id)) {
          newRead = readItems.filter(item => item !== id); // Uncheck
      } else {
          newRead = [...readItems, id]; // Check
      }
      setReadItems(newRead);
      localStorage.setItem(`read_${classId}`, JSON.stringify(newRead));
  };

  const getFileIcon = (fileName) => {
      if (!fileName) return faFilePdf;
      const lower = fileName.toLowerCase();
      if (lower.includes('jpg') || lower.includes('png')) return faFileImage;
      if (lower.includes('py') || lower.includes('cpp') || lower.includes('js')) return faFileCode;
      return faFilePdf;
  };

  return (
    <div className="min-vh-100 bg-dark text-white p-4">
      <button onClick={() => navigate(-1)} className="btn btn-outline-light mb-4 rounded-pill"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
      <div className="container" style={{maxWidth: "800px"}}>
        <h2 className="text-center mb-5 fw-bold"><FontAwesomeIcon icon={faBookOpen} className="text-info me-2"/> Learning Materials</h2>
        
        <div className="list-group">
            {materials.map(m => {
                const isRead = readItems.includes(m.id);
                // FORCE DOWNLOAD FIX
                const downloadUrl = m.link ? m.link.replace("/upload/", "/upload/fl_attachment/") : "#";

                return (
                <div key={m.id} className={`list-group-item bg-black text-white border-secondary p-3 d-flex align-items-center justify-content-between mb-2 rounded ${isRead ? "opacity-50" : ""}`}>
                    <div className="d-flex align-items-center">
                        <button onClick={() => toggleRead(m.id)} className="btn btn-link text-decoration-none p-0 me-3" title="Mark as Read">
                            <FontAwesomeIcon icon={isRead ? faCheckCircle : faCircle} className={isRead ? "text-success fs-4" : "text-secondary fs-4"} />
                        </button>
                        
                        <a href={downloadUrl} className="text-white text-decoration-none d-flex align-items-center">
                            <FontAwesomeIcon icon={getFileIcon(m.fileName)} className="text-danger fs-3 me-3" /> 
                            <div>
                                <h5 className="mb-0">{m.title}</h5>
                                <small className="text-white-50">Click to download</small>
                            </div>
                        </a>
                    </div>
                    
                    <a href={downloadUrl} className="btn btn-sm btn-outline-light"><FontAwesomeIcon icon={faDownload}/></a>
                </div>
            )})}
            {materials.length === 0 && <p className="text-center text-white-50">No materials yet.</p>}
        </div>
      </div>
    </div>
  );
};
export default StudentMaterials;