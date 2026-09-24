import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../utils/uploadUtils"; 
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCloudUploadAlt, faFilePdf, faSpinner, faFileCode, faTrash, faDownload, faFileImage, faEdit, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";

const SupervisorMaterials = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [materials, setMaterials] = useState([]);
  
  // Form State
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(null); // ID of material being edited

  useEffect(() => { fetchMaterials(); }, [classId]);

  const fetchMaterials = async () => {
    try {
      const q = query(collection(db, `classes/${classId}/materials`), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    if (!title) return alert("Please enter a title.");
    
    // If Creating New, file is required. If Editing, file is optional.
    if (!editMode && !file) return alert("Please select a file.");

    setUploading(true);
    try {
      let fileUrl = "";
      let fileName = "";

      // 1. Upload File (If selected)
      if (file) {
        const uploadedData = await uploadToCloudinary(file);
        fileUrl = uploadedData.url;
        fileName = uploadedData.fileName;
      }

      if (editMode) {
        // --- UPDATE EXISTING ---
        const updateData = { title };
        if (fileUrl) { // Only update file info if a new file was chosen
            updateData.link = fileUrl;
            updateData.fileName = fileName;
        }
        await updateDoc(doc(db, `classes/${classId}/materials`, editMode), updateData);
        alert("Material updated successfully!");
      } else {
        // --- CREATE NEW ---
        await addDoc(collection(db, `classes/${classId}/materials`), { 
          title, 
          link: fileUrl, 
          fileName: fileName,
          type: "File", 
          createdAt: serverTimestamp() 
        });
        alert("Material uploaded successfully!");
      }

      // Reset Form
      setTitle(""); 
      setFile(null); 
      setEditMode(null);
      fetchMaterials();

    } catch (error) {
      console.error("Error:", error);
      alert(`Operation Failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
      if(!window.confirm("Are you sure you want to delete this material?")) return;
      try {
        await deleteDoc(doc(db, `classes/${classId}/materials`, materialId));
        fetchMaterials();
      } catch (err) {
        alert("Error deleting file.");
      }
  };

  const startEdit = (m) => {
      setEditMode(m.id);
      setTitle(m.title);
      setFile(null); // Reset file input
      window.scrollTo(0,0); // Scroll to top
  };

  const cancelEdit = () => {
      setEditMode(null);
      setTitle("");
      setFile(null);
  };

  const getFileIcon = (fileName) => {
      if (!fileName) return faFilePdf;
      const lower = fileName.toLowerCase();
      if (lower.includes('jpg') || lower.includes('png')) return faFileImage;
      if (lower.includes('py') || lower.includes('cpp') || lower.includes('js') || lower.includes('html')) return faFileCode;
      return faFilePdf;
  };

  // Safe Download Link Helper
  const getDownloadUrl = (url) => {
      if (!url) return "#";
      return url.replace("/upload/", "/upload/fl_attachment/");
  };

  return (
    <div className="min-vh-100 bg-dark text-white p-4">
      <button onClick={() => navigate(-1)} className="btn btn-outline-light mb-4 rounded-pill"><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
      <div className="container" style={{maxWidth: "800px"}}>
        <div className="d-flex justify-content-between align-items-center mb-5">
            <h2 className="fw-bold mb-0">Manage Class Materials</h2>
            {editMode && (
                <button onClick={cancelEdit} className="btn btn-outline-warning rounded-pill">
                    <FontAwesomeIcon icon={faTimes} className="me-2"/> Cancel Edit
                </button>
            )}
        </div>
        
        {/* UPLOAD / EDIT CARD */}
        <div className={`card bg-secondary bg-opacity-25 mb-5 p-4 border-${editMode ? "warning" : "info"} shadow`}>
            <h5 className={`text-${editMode ? "warning" : "info"} mb-3`}>
                <FontAwesomeIcon icon={editMode ? faEdit : faCloudUploadAlt} className="me-2"/> 
                {editMode ? "Edit Material" : "Add New Resource"}
            </h5>
            
            <input 
                className="form-control bg-dark text-white mb-2 border-secondary" 
                placeholder="Title (e.g. Lecture 1 Slides)" 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                style={{color:'white'}}
            />
            
            <div className="mb-3">
                <label className="small text-white-50">{editMode ? "Replace File (Optional)" : "Select File"}</label>
                <input 
                    type="file" 
                    className="form-control bg-dark text-white border-secondary" 
                    onChange={(e) => setFile(e.target.files[0])} 
                />
            </div>
            
            <button onClick={handleSave} disabled={uploading} className={`btn btn-${editMode ? "warning" : "info"} w-100 fw-bold`}>
                {uploading ? <><FontAwesomeIcon icon={faSpinner} spin /> Processing...</> : (editMode ? "Update Material" : "Upload File")}
            </button>
        </div>

        {/* MATERIALS LIST */}
        <div className="list-group">
            {materials.map(m => {
                const downloadUrl = getDownloadUrl(m.link);
                
                return (
                <div key={m.id} className={`list-group-item bg-black text-white border-secondary p-3 d-flex align-items-center justify-content-between mb-2 rounded ${editMode === m.id ? "border-warning" : ""}`}>
                    <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={getFileIcon(m.fileName)} className="text-danger me-3 fs-3" /> 
                        <div>
                            <strong className="d-block">{m.title}</strong>
                            <small className="text-white-50">{m.fileName}</small>
                        </div>
                    </div>
                    <div>
                        <a href={downloadUrl} className="btn btn-sm btn-outline-light me-2" title="Download">
                            <FontAwesomeIcon icon={faDownload}/>
                        </a>
                        <button onClick={() => startEdit(m)} className="btn btn-sm btn-outline-warning me-2" title="Edit">
                            <FontAwesomeIcon icon={faEdit}/>
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="btn btn-sm btn-outline-danger" title="Delete">
                            <FontAwesomeIcon icon={faTrash}/>
                        </button>
                    </div>
                </div>
            )})}
            {materials.length === 0 && <div className="text-center text-white-50">No materials uploaded yet.</div>}
        </div>
      </div>
    </div>
  );
};
export default SupervisorMaterials;