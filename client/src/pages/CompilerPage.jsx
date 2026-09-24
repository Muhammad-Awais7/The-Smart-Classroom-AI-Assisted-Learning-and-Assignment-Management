import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faArrowLeft, faCode, faTerminal, faMicrochip, faFileUpload, faStop } from "@fortawesome/free-solid-svg-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion } from "framer-motion";

// ✅ USE THE VARIABLE FROM .ENV FILE
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

const CompilerPage = () => {
  const navigate = useNavigate();
  const terminalEndRef = useRef(null);

  const [code, setCode] = useState(`# Write your code here...`);
  
  // ✅ Advanced Terminal State
  const [terminalHistory, setTerminalHistory] = useState([]); // Array of { role: 'ai' | 'user', text: string }
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState("Auto-Detecting...");

  // Auto-scroll terminal to bottom when history updates
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, isWaitingForInput, loading]);

  // ✅ FILE UPLOAD HANDLER
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCode(event.target.result);
      setTerminalHistory([{ role: "ai", text: `File "${file.name}" loaded successfully. Ready to run.` }]);
    };
    reader.onerror = () => {
      setTerminalHistory([{ role: "ai", text: "Error reading file." }]);
    };

    reader.readAsText(file);
    e.target.value = null; 
  };

  // ✅ Core Function to iterate execution with Gemini
  const executeSimulationStep = async (currentHistory) => {
    if (!API_KEY) {
      setTerminalHistory(prev => [...prev, { role: "ai", text: "Error: API Key not found. Please check your .env file." }]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const genAI = new GoogleGenerativeAI(API_KEY);

    // EXACT MODELS REQUESTED
    const modelsToTry = [
      "gemini-3.1-flash-lite-preview",
        "gemini-3-flash-preview",
        "gemini-3.1-pro-preview"


                    
    ];

    let success = false;

    for (const modelName of modelsToTry) {
        if (success) break; 

        try {
            console.log(`Attempting connection to model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            // Format history for the AI to understand the current state
            const transcript = currentHistory.map(entry => 
              entry.role === 'user' ? `[USER TYPED]: ${entry.text}` : entry.text
            ).join("\n");

            // 🧠 THE PROMPT: Forces AI to pause at inputs
            const prompt = `
                You are simulating a live terminal execution of code. 
                
                CODE TO EXECUTE:
                \`\`\`
                ${code}
                \`\`\`

                EXECUTION TRANSCRIPT SO FAR:
                """
                ${transcript}
                """

                INSTRUCTIONS:
                1. Look at the CODE and the TRANSCRIPT. Determine exactly where the execution currently is.
                2. Resume execution from that exact point.
                3. If the next step in the code requires user input (e.g., input(), cin, Scanner), output the prompt text exactly as it appears in the code, and then immediately output the exact string "[WAITING_FOR_INPUT]" and STOP. Do not guess what the user will type.
                4. If the code reaches the end and finishes execution, output the remaining results and output the exact string "[FINISHED]".
                5. Output ONLY the raw terminal text and the special tags. Do NOT write markdown blocks, do NOT explain the code, and do NOT add conversational filler.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // Process the AI's response tags
            if (text.includes("[WAITING_FOR_INPUT]")) {
              text = text.replace("[WAITING_FOR_INPUT]", "").trim();
              if (text) setTerminalHistory(prev => [...prev, { role: "ai", text: text }]);
              setIsWaitingForInput(true);
              setLoading(false);
            } 
            else if (text.includes("[FINISHED]")) {
              text = text.replace("[FINISHED]", "").trim();
              if (text) setTerminalHistory(prev => [...prev, { role: "ai", text: text }]);
              setTerminalHistory(prev => [...prev, { role: "ai", text: "\n--- Execution Finished ---" }]);
              setIsWaitingForInput(false);
              setLoading(false);
            } 
            else {
              // Failsafe if it forgets tags but finishes
              if (text) setTerminalHistory(prev => [...prev, { role: "ai", text: text }]);
              setTerminalHistory(prev => [...prev, { role: "ai", text: "\n--- Execution Finished ---" }]);
              setIsWaitingForInput(false);
              setLoading(false);
            }

            setActiveModel(modelName); 
            success = true;

        } catch (error) {
            console.warn(`Failed with ${modelName}:`, error.message);
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                setTerminalHistory(prev => [...prev, { role: "ai", text: `Error: Could not connect to Google Gemini. \n\nTroubleshooting:\n1. Check your API Key.\n2. Ensure your Google Cloud Project has "Generative Language API" enabled.` }]);
                setIsWaitingForInput(false);
                setLoading(false);
            }
        }
    }
  };

  // ✅ Triggered when "Run" is clicked
  const handleStartCode = () => {
    setTerminalHistory([{ role: "ai", text: "Initializing AI Environment...\n" }]);
    setIsWaitingForInput(false);
    setUserInput("");
    
    // Start simulation with empty history
    executeSimulationStep([]); 
  };

  // ✅ Triggered when user presses Enter in the terminal
  const handleTerminalSubmit = (e) => {
    if (e.key === "Enter" && userInput.trim() !== "") {
      e.preventDefault();
      
      const newHistory = [...terminalHistory, { role: "user", text: userInput }];
      setTerminalHistory(newHistory);
      
      setIsWaitingForInput(false);
      setUserInput("");
      
      // Resume simulation with updated history
      executeSimulationStep(newHistory);
    }
  };

  const handleStop = () => {
    setLoading(false);
    setIsWaitingForInput(false);
    setTerminalHistory(prev => [...prev, { role: "ai", text: "\n--- Execution Terminated ---" }]);
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#1e1e1e", color: "#d4d4d4", fontFamily: "'Consolas', 'Monaco', monospace" }}>
      
      {/* Header */}
      <header className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center bg-black">
        <div className="d-flex align-items-center gap-3">
           <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary rounded-pill px-3">
             <FontAwesomeIcon icon={faArrowLeft} /> Back
           </button>
           <h5 className="m-0 text-white d-flex align-items-center">
             <FontAwesomeIcon icon={faCode} className="text-success me-2" /> Smart Code Lab
           </h5>
        </div>

        <div className="d-flex align-items-center gap-3">
           <div>
             <input 
               type="file" 
               id="codeUpload" 
               accept=".py,.cpp,.c,.java,.js,.txt,.html,.css" 
               style={{ display: 'none' }} 
               onChange={handleFileUpload}
             />
             <motion.label 
               htmlFor="codeUpload"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="btn btn-sm btn-outline-info rounded-pill px-3 cursor-pointer m-0"
               style={{ cursor: "pointer" }}
             >
               <FontAwesomeIcon icon={faFileUpload} className="me-2" /> Upload File
             </motion.label>
           </div>

           <div className="d-flex align-items-center gap-2 border-start border-secondary ps-3">
             <FontAwesomeIcon icon={faMicrochip} className={activeModel.includes("Detecting") ? "text-warning" : "text-success"} />
             <span className="small text-secondary">{activeModel}</span>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="row g-0 flex-grow-1">
        
        {/* Code Editor Area */}
        <div className="col-md-7 d-flex flex-column border-end border-secondary">
          <textarea 
            className="flex-grow-1 p-4 bg-dark text-light border-0"
            style={{ 
                resize: "none", 
                outline: "none", 
                fontSize: "1.1rem", 
                lineHeight: "1.6",
                color: "#9cdcfe", 
                backgroundColor: "#1e1e1e",
                fontFamily: "'Fira Code', monospace"
            }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            placeholder="Type code here or upload a file..."
          />
          
          <div className="p-3 bg-black border-top border-secondary text-end d-flex justify-content-end gap-2">
            {(loading || isWaitingForInput) && (
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleStop} 
                className="btn btn-danger px-4 fw-bold rounded-pill shadow-sm"
              >
                <FontAwesomeIcon icon={faStop} className="me-2" /> Stop
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartCode} 
              disabled={loading && !isWaitingForInput} 
              className="btn btn-success px-5 fw-bold rounded-pill shadow-lg d-inline-flex align-items-center"
              style={{ background: "#00ff9d", color: "#000", border: "none" }}
            >
              <FontAwesomeIcon icon={faPlay} className="me-2" /> 
              {loading ? "Running..." : "Run Code"}
            </motion.button>
          </div>
        </div>

        {/* Output Terminal Area */}
        <div className="col-md-5 d-flex flex-column" style={{ background: "#0d0d0d", height: "calc(100vh - 73px)" }}>
          <div className="p-2 border-bottom border-secondary text-secondary small fw-bold text-uppercase tracking-wider d-flex align-items-center">
            <FontAwesomeIcon icon={faTerminal} className="me-2" /> Terminal Output
          </div>
          
          <div className="flex-grow-1 p-4 font-monospace" style={{ overflowY: "auto", color: "#00ff9d" }}>
            
            {/* Render Output History */}
            {terminalHistory.length === 0 && !loading && (
              <span className="text-secondary opacity-50">// Output will appear here after running...</span>
            )}

            {terminalHistory.map((line, index) => (
              <div 
                key={index} 
                style={{ 
                  color: line.role === "user" ? "#0dcaf0" : "#00ff9d", 
                  whiteSpace: "pre-wrap",
                  marginBottom: line.role === "user" ? "8px" : "0px"
                }}
              >
                {line.role === "user" ? `> ${line.text}` : line.text}
              </div>
            ))}

            {/* Live Input Field for Terminal */}
            {isWaitingForInput && (
              <div className="d-flex align-items-center mt-1">
                <span className="me-2 text-info">&gt;</span>
                <input 
                  type="text" 
                  autoFocus
                  className="bg-transparent border-0 text-info outline-none flex-grow-1 font-monospace"
                  style={{ outline: "none", boxShadow: "none", padding: 0 }}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleTerminalSubmit}
                  placeholder="Type input and press Enter..."
                />
              </div>
            )}

            {/* Loading Indicator */}
            {loading && !isWaitingForInput && (
              <div className="d-flex align-items-center text-warning mt-2">
                <span className="spinner-border spinner-border-sm me-2"></span>
                Processing...
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompilerPage;