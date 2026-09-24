import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSearch, faShieldAlt, faRobot, faCopy, faCheckCircle, faFileUpload, faSpinner, faTrash, faChartArea, faDownload, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, Legend } from "recharts";

// Import PDF & Canvas Libraries
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Import Extraction Libraries
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

const PlagiarismChecker = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const reportRef = useRef(null); // Reference for the HIDDEN PDF snapshot

  // State Management
  const [textToAnalyze, setTextToAnalyze] = useState("");
  const [docInfo, setDocInfo] = useState({ name: "Manual Text Entry", words: 0 }); // Added Doc Info state
  const [reportData, setReportData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeModel, setActiveModel] = useState("Ready");

  // --- GLASSMORPHISM STYLES (For Web UI) ---
  const glassStyle = {
    background: "rgba(20, 20, 30, 0.5)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    boxShadow: "0 15px 35px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255,255,255,0.05)"
  };

  const inputGlassStyle = {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    color: "#fff",
    boxShadow: "inset 0 4px 10px rgba(0,0,0,0.5)"
  };

  // --- FILE EXTRACTION LOGIC ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setExtracting(true);
    setTextToAnalyze("Extracting text from file... please wait.");
    setReportData(null);
    setErrorMsg("");

    try {
        let extractedText = "";

        if (file.type === "application/pdf") {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                extractedText += pageText + "\n\n";
            }
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            extractedText = result.value;
        } else {
            alert("Unsupported file type. Please upload a PDF or DOCX file.");
            setExtracting(false);
            setTextToAnalyze("");
            return;
        }

        const wordCount = extractedText.trim().split(/\s+/).length;
        setDocInfo({ name: file.name, words: wordCount });
        setTextToAnalyze(extractedText);
        setExtracting(false);

    } catch (error) {
        console.error("Extraction Error:", error);
        alert("Failed to extract text from file.");
        setTextToAnalyze("");
        setExtracting(false);
    }
  };

  // --- GEMINI ANALYSIS LOGIC ---
  const handleCheck = async () => {
    if (!textToAnalyze.trim()) return alert("Please paste text or upload a file.");
    if (!API_KEY) return setErrorMsg("Error: Gemini API Key not found.");

    // Update word count if manually pasted
    if (docInfo.name === "Manual Text Entry") {
        setDocInfo({ name: "Manual Text Entry", words: textToAnalyze.trim().split(/\s+/).length });
    }

    setLoading(true);
    setReportData(null);
    setErrorMsg("");
    setActiveModel("Connecting...");

    const genAI = new GoogleGenerativeAI(API_KEY);
    
    const modelsToTry = [
        "gemini-2.5-flash",       
        "gemini-1.5-flash",       
        "gemini-1.5-pro",         
        "gemini-pro"              
    ];
    let success = false;

    for (const modelName of modelsToTry) {
        if (success) break;
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.0 // Strict Determinism
                }
            });
            
            const prompt = `
                Act as a highly strict AI-content and plagiarism detection system.
                Analyze the following text.
                
                Respond STRICTLY in valid JSON using this exact structure:
                {
                  "aiScore": <number 0-100>,
                  "plagScore": <number 0-100>,
                  "briefAnalysis": "<1 short sentence summarizing the finding>",
                  "detailedAnalysis": "<A 3-4 sentence detailed breakdown of linguistic patterns, perplexity, and originality>",
                  "scanSignature": [
                    {"segment": "Start", "aiRisk": <number 0-100>, "plagRisk": <number 0-100>},
                    {"segment": "Q1", "aiRisk": <number 0-100>, "plagRisk": <number 0-100>},
                    {"segment": "Mid", "aiRisk": <number 0-100>, "plagRisk": <number 0-100>},
                    {"segment": "Q3", "aiRisk": <number 0-100>, "plagRisk": <number 0-100>},
                    {"segment": "End", "aiRisk": <number 0-100>, "plagRisk": <number 0-100>}
                  ]
                }

                Text to analyze:
                """${textToAnalyze.substring(0, 30000)}""" 
            `; 

            const aiResult = await model.generateContent(prompt);
            const responseText = await aiResult.response.text();
            
            const parsedData = JSON.parse(responseText);
            setReportData(parsedData);
            setActiveModel(modelName);
            success = true;

        } catch (error) {
            console.warn(`Failed with ${modelName}:`, error.message);
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                setErrorMsg(`Error: Scan failed. Details: ${error.message}`);
                setActiveModel("Failed");
            }
        }
    }
    setLoading(false);
  };

  const handleClear = () => {
      setTextToAnalyze("");
      setReportData(null);
      setErrorMsg("");
      setActiveModel("Ready");
      setDocInfo({ name: "Manual Text Entry", words: 0 });
      if(fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- PDF DOWNLOAD LOGIC ---
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    try {
        // We capture the hidden white template, ensuring all charts are fully rendered
        const canvas = await html2canvas(reportRef.current, {
            scale: 2, 
            backgroundColor: "#ffffff", 
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        
        // A4 Paper format
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`NeuralScanner_${docInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Failed to download the PDF report.");
    } finally {
        setIsDownloading(false);
    }
  };

  // Custom Tooltip for Web UI
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "rgba(15, 15, 25, 0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "12px" }}>
          <p className="text-light m-0 mb-2 fw-bold border-bottom border-secondary pb-1">{label} Section</p>
          {payload.map((entry, index) => (
            <p key={index} className="m-0 small fw-semibold" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="d-flex flex-column min-vh-100 position-relative overflow-hidden" style={{ 
        background: "radial-gradient(circle at top right, #1a1025 0%, #0d0e15 50%, #050a12 100%)", 
        color: "#d4d4d4", 
        fontFamily: "'Inter', 'Segoe UI', sans-serif" 
    }}>
      
      {/* ------------------------------------------------------------------------- */}
      {/* 1. HIDDEN PDF TEMPLATE (This renders off-screen purely for downloading) */}
      {/* ------------------------------------------------------------------------- */}
      <div 
        ref={reportRef} 
        style={{ 
            position: "absolute", left: "-9999px", top: 0, // Keeps it hidden from user
            width: "794px", minHeight: "1123px", // Standard A4 pixel dimensions
            backgroundColor: "#ffffff", color: "#111827", padding: "40px", fontFamily: "Arial, sans-serif" 
        }}
      >
        {reportData && (
            <div>
                {/* Header */}
                <div style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ color: "#111827", margin: 0, fontSize: "28px", fontWeight: "bold" }}>Authenticity Report</h1>
                        <p style={{ color: "#6b7280", margin: "5px 0 0 0", fontSize: "14px" }}>Generated by Neural Scanner Engine</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "#374151", fontWeight: "bold" }}>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Document Info */}
                <div style={{ backgroundColor: "#f3f4f6", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#374151" }}>Document Details</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#4b5563" }}>
                        <p style={{ margin: 0 }}><strong>File Name:</strong> {docInfo.name}</p>
                        <p style={{ margin: 0 }}><strong>Word Count:</strong> ~{docInfo.words} words</p>
                      
                    </div>
                </div>

                {/* Scores */}
                <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
                    <div style={{ flex: 1, padding: "20px", borderRadius: "8px", border: "1px solid #fbcfe8", backgroundColor: "#fdf2f8", textAlign: "center" }}>
                        <p style={{ margin: 0, textTransform: "uppercase", fontSize: "12px", fontWeight: "bold", color: "#db2777" }}>AI Generation Probability</p>
                        <h2 style={{ margin: "10px 0 0 0", fontSize: "36px", color: "#be185d" }}>{reportData.aiScore}%</h2>
                    </div>
                    <div style={{ flex: 1, padding: "20px", borderRadius: "8px", border: "1px solid #fde68a", backgroundColor: "#fffbeb", textAlign: "center" }}>
                        <p style={{ margin: 0, textTransform: "uppercase", fontSize: "12px", fontWeight: "bold", color: "#d97706" }}>Plagiarism Match</p>
                        <h2 style={{ margin: "10px 0 0 0", fontSize: "36px", color: "#b45309" }}>{reportData.plagScore}%</h2>
                    </div>
                </div>

                {/* White Background Graph */}
                <div style={{ marginBottom: "30px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#374151" }}>Segment Fluctuations (Start to Finish)</h3>
                    <div style={{ width: "100%", height: "250px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={reportData.scanSignature} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="segment" stroke="#6b7280" tick={{fill: '#4b5563', fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis stroke="#6b7280" tick={{fill: '#4b5563', fontSize: 12}} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "14px", color: "#111827" }} />
                                {/* isAnimationActive={false} is CRUCIAL here so the PDF captures the lines instantly */}
                                <Area type="monotone" name="AI Generated" dataKey="aiRisk" stroke="#db2777" strokeWidth={3} fillOpacity={0.1} fill="#db2777" isAnimationActive={false} />
                                <Area type="monotone" name="Plagiarized" dataKey="plagRisk" stroke="#d97706" strokeWidth={3} fillOpacity={0.1} fill="#d97706" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Analysis */}
                <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#374151", borderBottom: "1px solid #e5e7eb", paddingBottom: "5px" }}>Detailed Analysis</h3>
                    <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#4b5563" }}>
                        <strong>Summary:</strong> {reportData.briefAnalysis}
                    </p>
                    <p style={{ marginTop: "10px", fontSize: "14px", lineHeight: "1.6", color: "#4b5563" }}>
                        <strong>Linguistic Breakdown:</strong> {reportData.detailedAnalysis}
                    </p>
                </div>
            </div>
        )}
      </div>
      {/* ------------------------------------------------------------------------- */}



      {/* 2. MAIN WEB UI (Dark Theme) */}
      <header className="p-4 d-flex justify-content-between align-items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 10 }}>
        <div className="d-flex align-items-center">
           <button onClick={() => navigate(-1)} className="btn btn-sm text-light me-4" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "50%", width: "40px", height: "40px" }}>
             <FontAwesomeIcon icon={faArrowLeft} /> 
           </button>
           <h4 className="m-0 text-white fw-bold tracking-wide">
             <FontAwesomeIcon icon={faShieldAlt} className="text-info me-2" /> 
             Plagrism Detector
           </h4>
        </div>
        <div className="d-flex align-items-center gap-3">
           <span className="small text-secondary fw-semibold">Engine: <span className="text-light">{activeModel}</span></span>
           <FontAwesomeIcon icon={faRobot} className={loading ? "text-info fa-fade" : "text-secondary"} />
        </div>
      </header>

      <div className="container-fluid flex-grow-1 p-4" style={{ zIndex: 10 }}>
        <div className="row g-4 h-100">
          
          {/* Left Side: Input Panel */}
          <div className="col-lg-5 d-flex flex-column">
            <motion.div style={glassStyle} className="p-4 d-flex flex-column h-100" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="text-white m-0 fw-semibold"><FontAwesomeIcon icon={faCopy} className="me-2 text-info"/> Input Source</h5>
                    <div className="d-flex gap-2">
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf,.docx" onChange={handleFileUpload} />
                        
                        <button onClick={() => fileInputRef.current.click()} disabled={extracting || loading} className="btn btn-sm btn-outline-light border-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                            {extracting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faFileUpload} />} 
                        </button>
                        <button onClick={handleClear} className="btn btn-sm btn-outline-danger border-0" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                            <FontAwesomeIcon icon={faTrash}/>
                        </button>
                    </div>
                </div>

                <div className="text-secondary small mb-2"><FontAwesomeIcon icon={faFileAlt} className="me-1"/> {docInfo.name} | ~{docInfo.words} words</div>
                
                <textarea 
                    className="flex-grow-1 p-4 w-100"
                    style={{ ...inputGlassStyle, resize: "none", outline: "none", fontSize: "0.95rem", lineHeight: "1.7" }}
                    placeholder="Paste text manually or upload a PDF/Word document..."
                    value={textToAnalyze}
                    onChange={(e) => setTextToAnalyze(e.target.value)}
                    disabled={extracting || loading}
                />
                
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(6, 182, 212, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheck} 
                  disabled={loading || extracting || !textToAnalyze} 
                  className="btn mt-4 py-3 fw-bold rounded-pill border-0 text-dark"
                  style={{ background: "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)", textShadow: "0 1px 2px rgba(255,255,255,0.3)" }}
                >
                  <FontAwesomeIcon icon={faSearch} className="me-2" /> 
                  {loading ? "Scanning Vector Space..." : "Initialize Scan"}
                </motion.button>
            </motion.div>
          </div>

          {/* Right Side: Graph Dashboard */}
          <div className="col-lg-7 d-flex flex-column">
            <motion.div style={glassStyle} className="p-4 d-flex flex-column h-100" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="text-white m-0 fw-semibold"><FontAwesomeIcon icon={faChartArea} className="me-2" style={{color: "#ec4899"}}/> Scan Telemetry</h5>
                  
                  {reportData && (
                      <button 
                          onClick={handleDownloadPDF} 
                          disabled={isDownloading}
                          className="btn btn-sm text-light border-0 px-3 py-2 rounded-pill d-flex align-items-center gap-2 shadow-sm"
                          style={{ background: "#3b82f6", transition: "all 0.3s ease" }}
                      >
                          {isDownloading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faDownload} />}
                          <span className="fw-semibold small">{isDownloading ? "Generating PDF..." : "Export Full PDF Report"}</span>
                      </button>
                  )}
              </div>
              
              <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                
                {loading && (
                    <div className="d-flex flex-column align-items-center" style={{ color: "#06b6d4" }}>
                        <div className="spinner-border mb-3" style={{width: "2.5rem", height: "2.5rem"}} role="status"></div>
                        <p className="fw-semibold text-uppercase tracking-wide" style={{ letterSpacing: "3px" }}>Synthesizing Data...</p>
                    </div>
                )}

                {!loading && errorMsg && <div className="alert w-100 text-center" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}>{errorMsg}</div>}

                {!loading && !reportData && !errorMsg && (
                    <p className="text-secondary opacity-50 fw-light text-center">Telemetry offline.<br/>Awaiting document input.</p>
                )}

                <AnimatePresence>
                    {!loading && reportData && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="w-100 h-100 d-flex flex-column"
                        >
                            {/* Top Scores */}
                            <div className="row text-center mb-4 g-3">
                                <div className="col-6">
                                    <div className="p-3 rounded-4" style={{ background: "rgba(236, 72, 153, 0.1)", border: "1px solid rgba(236, 72, 153, 0.2)" }}>
                                        <p className="small text-uppercase mb-1 fw-semibold" style={{ color: "#fbcfe8" }}>AI Probability</p>
                                        <h2 className="fw-bold m-0" style={{ color: "#ec4899", textShadow: "0 0 15px rgba(236,72,153,0.5)" }}>{reportData.aiScore}%</h2>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-3 rounded-4" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                                        <p className="small text-uppercase mb-1 fw-semibold" style={{ color: "#fde68a" }}>Plagiarism Match</p>
                                        <h2 className="fw-bold m-0" style={{ color: "#f59e0b", textShadow: "0 0 15px rgba(245,158,11,0.5)" }}>{reportData.plagScore}%</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Web Graph */}
                            <div className="flex-grow-1 w-100 mt-2" style={{ minHeight: "280px" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={reportData.scanSignature} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.6}/>
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorPlag" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                        <XAxis dataKey="segment" stroke="rgba(255,255,255,0.4)" tick={{fill: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.4)" tick={{fill: 'rgba(255,255,255,0.6)', fontSize: 12}} axisLine={false} tickLine={false} domain={[0, 100]} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "14px", fontWeight: "500", color: "#fff" }} />
                                        <Area type="monotone" name="AI Generated" dataKey="aiRisk" stroke="#ec4899" strokeWidth={4} fillOpacity={1} fill="url(#colorAi)" activeDot={{ r: 6, fill: "#ec4899", stroke: "#fff", strokeWidth: 2 }} />
                                        <Area type="monotone" name="Plagiarized" dataKey="plagRisk" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorPlag)" activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Minimal Text Output */}
                            <div className="mt-4 p-3 rounded-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <p className="text-light m-0 fw-light" style={{ fontSize: "1rem", letterSpacing: "0.5px" }}>
                                    {reportData.briefAnalysis}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismChecker;