import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faPaperPlane, 
  faPlus, 
  faTrash, 
  faRobot, 
  faChalkboardTeacher, 
  faCommentDots 
} from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

const SupervisorChatbot = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // --- Load Chats & Auto-Create (Fixed) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const sessionsRef = collection(db, "chats", user.uid, "sessions");
        const snapshot = await getDocs(sessionsRef);
        const sessions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        setChats(sessions);

        if (sessions.length > 0) {
          // If chats exist, open the first one
          setActiveChatId(sessions[0].id);
          setMessages(sessions[0].messages || []);
        } else {
          // If NO chats exist, create one automatically
          createInitialChat(user);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Helper to create chat inside useEffect
  const createInitialChat = async (user) => {
    const sessionsRef = collection(db, "chats", user.uid, "sessions");
    const newChat = {
      title: `Session ${new Date().toLocaleDateString()}`,
      messages: [
        {
          sender: "bot",
          text: `👋 Hello Instructor ${user.displayName || ""}! How can I assist you with project supervision today?`,
          timestamp: Date.now(),
        },
      ],
    };
    const docRef = await addDoc(sessionsRef, newChat);
    setChats([{ id: docRef.id, ...newChat }]);
    setActiveChatId(docRef.id);
    setMessages(newChat.messages);
  };

  // --- Select Chat ---
  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId);
    const user = auth.currentUser;
    if (!user) return;
    const chatDoc = await getDoc(doc(db, "chats", user.uid, "sessions", chatId));
    if (chatDoc.exists()) setMessages(chatDoc.data().messages || []);
  };

  // --- New Chat (Manual) ---
  const handleNewChat = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const sessionsRef = collection(db, "chats", user.uid, "sessions");
    const newChat = {
      title: `Session ${new Date().toLocaleDateString()}`,
      messages: [
        {
          sender: "bot",
          text: `👋 Hello Instructor ${user.displayName || ""}! How can I assist you with project supervision today?`,
          timestamp: Date.now(),
        },
      ],
    };
    const docRef = await addDoc(sessionsRef, newChat);
    const chatId = docRef.id;

    setChats((prev) => [...prev, { id: chatId, ...newChat }]);
    setActiveChatId(chatId);
    setMessages(newChat.messages);
  };

  // --- Delete Chat ---
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;

    const user = auth.currentUser;
    await deleteDoc(doc(db, "chats", user.uid, "sessions", chatId));
    
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }
  };

  // --- Send Message ---
  const handleSend = async () => {
    if (!input.trim() || !activeChatId) return;

    const userMsg = { sender: "user", text: input, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const user = auth.currentUser;
    const chatRef = doc(db, "chats", user.uid, "sessions", activeChatId);
    await updateDoc(chatRef, { messages: updatedMessages });

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await response.json();
      const botMsg = {
        sender: "bot",
        text: data.reply || "⚠️ I'm having trouble connecting right now.",
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      await updateDoc(chatRef, { messages: finalMessages });
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = { sender: "bot", text: "⚠️ Error: Unable to reach the server.", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIX 1: Use vh-100 and overflow-hidden to fix the viewport
    <div className="d-flex vh-100 w-100 overflow-hidden" 
      style={{ 
        background: "radial-gradient(circle at center, #0f0c29 0%, #302b63 100%)", 
        color: "#fff", 
        fontFamily: "'Segoe UI', sans-serif"
      }}
    >
      
      {/* --- Sidebar --- */}
      {/* FIX 2: Removed 'position: fixed'. Using Flex Shrink 0 to keep width constant */}
      <motion.aside
        initial={{ x: -100 }} animate={{ x: 0 }}
        className="d-none d-md-flex flex-column p-3 border-end border-secondary h-100"
        style={{ 
          width: "280px", 
          minWidth: "280px",
          background: "rgba(0, 0, 0, 0.3)", 
          backdropFilter: "blur(15px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          flexShrink: 0 
        }}
      >
        <h4 className="fw-bold mb-4 text-white d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faRobot} className="text-warning" /> AI Assistant
        </h4>

        <motion.button 
          whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255, 193, 7, 0.5)" }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-warning text-dark fw-bold mb-4 w-100 rounded-pill shadow-lg"
          style={{ background: "linear-gradient(45deg, #FFC107, #FF9800)", border: "none" }}
          onClick={handleNewChat}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" /> New Conversation
        </motion.button>

        <div className="flex-grow-1 overflow-auto custom-scrollbar" style={{ scrollbarWidth: "thin" }}>
          <small className="text-white-50 text-uppercase fw-bold mb-2 d-block px-2">History</small>
          {chats.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.1)" }}
              onClick={() => handleSelectChat(c.id)}
              className={`d-flex justify-content-between align-items-center p-3 mb-2 rounded-3 transition-all ${
                activeChatId === c.id 
                  ? "bg-white bg-opacity-10 border border-warning border-opacity-50 text-white shadow" 
                  : "text-white-50"
              }`}
              style={{ cursor: "pointer", transition: "all 0.2s" }}
            >
              <div className="d-flex align-items-center text-truncate">
                <FontAwesomeIcon icon={faCommentDots} className={`me-3 ${activeChatId === c.id ? "text-warning" : ""}`} />
                <span className="text-truncate" style={{ maxWidth: "140px" }}>{c.title}</span>
              </div>
              <motion.span whileHover={{ scale: 1.2, color: "#ef4444" }} onClick={(e) => handleDeleteChat(e, c.id)}>
                <FontAwesomeIcon icon={faTrash} className="small opacity-50 hover-opacity-100" />
              </motion.span>
            </motion.div>
          ))}
        </div>
      </motion.aside>

      {/* --- Main Chat Area --- */}
      {/* FIX 3: Flex-grow-1 fills remaining space. flex-column allows internal scrolling */}
      <div className="d-flex flex-column h-100 flex-grow-1 position-relative">
        
        {/* Header (Fixed Height) */}
        <header
          className="py-3 px-4 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10"
          style={{ background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(10px)", flexShrink: 0 }}
        >
          <h5 className="m-0 fw-bold text-white">Supervisor AI Chat</h5>
          <button
            onClick={() => navigate("/SupervisorDashboard")}
            className="btn btn-outline-light rounded-pill px-3 btn-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Exit
          </button>
        </header>

        {/* Chat Feed (Scrollable) */}
        {/* FIX 4: overflow-y-auto ONLY on this element. */}
        <main 
          className="flex-grow-1 px-3 px-md-5 py-4 overflow-auto custom-scrollbar" 
          style={{ 
            scrollbarColor: "#444 transparent",
            background: "radial-gradient(circle at center, #0f0c29 0%, #000 100%)" 
          }}
        >
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`d-flex mb-4 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"}`}
              >
                {/* Avatar for Bot */}
                {msg.sender === "bot" && (
                  <div className="me-3 d-flex align-items-end">
                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow-lg" 
                         style={{ width: 40, height: 40, background: "linear-gradient(135deg, #FFC107, #FF9800)" }}>
                      <FontAwesomeIcon icon={faRobot} className="text-dark" />
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div style={{ maxWidth: "75%" }}>
                  <div className={`p-3 rounded-4 shadow-lg ${
                      msg.sender === "user" 
                        ? "text-white" 
                        : "text-light border border-white border-opacity-10"
                    }`}
                    style={{ 
                      background: msg.sender === "user" 
                        ? "linear-gradient(135deg, #FFC107 0%, #FF5E62 100%)" 
                        : "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(5px)",
                      borderTopLeftRadius: msg.sender === "bot" ? "4px" : "20px",
                      borderTopRightRadius: msg.sender === "user" ? "4px" : "20px",
                    }}
                  >
                    {msg.sender === "bot" ? (
                      <div className="markdown-body text-white" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.95rem" }}>{msg.text}</span>
                    )}
                  </div>
                  <div className={`small mt-1 text-white-50 ${msg.sender === "user" ? "text-end me-1" : "ms-1"}`} style={{ fontSize: "0.7rem" }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Avatar for User (Supervisor) */}
                {msg.sender === "user" && (
                  <div className="ms-3 d-flex align-items-end">
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-lg" 
                         style={{ width: 40, height: 40 }}>
                      <FontAwesomeIcon icon={faChalkboardTeacher} className="text-dark" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="d-flex align-items-center ms-5 mb-4">
               <div className="spinner-grow spinner-grow-sm text-warning me-1" role="status"></div>
               <div className="spinner-grow spinner-grow-sm text-warning me-1" style={{animationDelay: "0.2s"}} role="status"></div>
               <div className="spinner-grow spinner-grow-sm text-warning" style={{animationDelay: "0.4s"}} role="status"></div>
            </motion.div>
          )}
          
          <div ref={chatEndRef} />
        </main>

        {/* Input Area (Fixed Height) */}
        <div className="p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
          <div className="d-flex align-items-center rounded-pill border border-secondary border-opacity-50 p-1"
               style={{ background: "rgba(255,255,255,0.05)" }}>
            <input
              type="text"
              className="form-control bg-transparent border-0 text-white shadow-none px-4"
              placeholder="Ask anything about supervision..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{ height: "50px" }}
            />
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: "#FF9800" }} 
              whileTap={{ scale: 0.9 }}
              className="btn btn-warning rounded-circle d-flex align-items-center justify-content-center me-1"
              style={{ width: "45px", height: "45px", background: "linear-gradient(135deg, #FFC107, #FF9800)", border: "none" }}
              onClick={handleSend} 
              disabled={loading || !activeChatId}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-dark" />
            </motion.button>
          </div>
          <div className="text-center mt-2">
             <small className="text-white-50" style={{fontSize: "0.7rem"}}>AI responses can be inaccurate. Double check critical info.</small>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupervisorChatbot;