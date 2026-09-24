// src/pages/pmoLogin.jsx

import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Navbar,
  InputGroup
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUserTie,
  faLock,
  faEnvelope,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const PmoLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // -----------------------------------------
  // Restore PMO session after refresh/browser reopen
  // -----------------------------------------
  useEffect(() => {
    const pmoAuth = localStorage.getItem("pmoAuth");

    if (pmoAuth === "true") {
      navigate("/PMODashboard", { replace: true });
    }
  }, [navigate]);

  // -----------------------------------------
  // PMO Login
  // -----------------------------------------
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const pmoEmail = import.meta.env.VITE_PMO_EMAIL;
    const pmoPass = import.meta.env.VITE_PMO_PASS;

    const enteredEmail = email.trim();

    if (enteredEmail === pmoEmail && password === pmoPass) {
      // PMO session permanently stays until manual logout
      localStorage.setItem("pmoAuth", "true");

      // Go to dashboard without keeping login page in history
      navigate("/PMODashboard", { replace: true });
    } else {
      setError("Invalid Admin credentials");
    }
  };

  const inputStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    backdropFilter: "blur(5px)"
  };

  return (
    <div
      className="d-flex flex-column min-vh-100 position-relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#fff"
      }}
    >
      {/* --- Background Animated Orbs --- */}
      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "400px",
          height: "400px",
          background: "#00ff9d",
          filter: "blur(150px)",
          top: "-10%",
          left: "-10%",
          opacity: 0.2,
          zIndex: 0
        }}
        animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 10 }}
      />

      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "300px",
          height: "300px",
          background: "#00d4ff",
          filter: "blur(120px)",
          bottom: "-5%",
          right: "-5%",
          opacity: 0.15,
          zIndex: 0
        }}
        animate={{ scale: [1, 1.3, 1], y: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 12 }}
      />

      {/* --- Navbar --- */}
      <Navbar
        className="py-3 px-4 shadow-lg"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 10
        }}
      >
        <Container fluid>
          <Navbar.Brand className="fw-bold text-white fs-4 d-flex align-items-center gap-2">
            <FontAwesomeIcon
              icon={faUserTie}
              style={{ color: "#00ff9d" }}
            />

            <span>
              Admin <span style={{ color: "#00ff9d" }}>Login</span>
            </span>
          </Navbar.Brand>
        </Container>
      </Navbar>

      {/* --- Main Content --- */}
      <Container
        className="flex-grow-1 d-flex align-items-center justify-content-center"
        style={{ zIndex: 5 }}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="p-4 p-md-5 rounded-4 shadow-lg w-100"
          style={{
            maxWidth: "450px",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 0 40px rgba(0,0,0,0.5)"
          }}
        >
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "80px",
                height: "80px",
                background: "rgba(0, 255, 157, 0.1)",
                border: "1px solid #00ff9d",
                boxShadow: "0 0 15px rgba(0, 255, 157, 0.3)"
              }}
            >
              <FontAwesomeIcon
                icon={faUserTie}
                size="2x"
                style={{ color: "#00ff9d" }}
              />
            </div>

            <h3 className="fw-bold text-white">Welcome Admin</h3>

            <p className="text-white-50 small">
              Enter your credentials to access the panel
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="alert alert-danger border-0 shadow-sm mb-4"
              style={{
                background: "rgba(220, 53, 69, 0.2)",
                color: "#ff6b6b"
              }}
            >
              {error}
            </motion.div>
          )}

          <Form onSubmit={handleLogin}>
            {/* Email */}
            <Form.Group className="mb-3">
              <Form.Label className="small text-white-50 ms-1">
                Email Address
              </Form.Label>

              <InputGroup>
                <InputGroup.Text
                  className="border-0"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#00ff9d"
                  }}
                >
                  <FontAwesomeIcon icon={faEnvelope} />
                </InputGroup.Text>

                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="text-white shadow-none"
                  style={inputStyle}
                  required
                />
              </InputGroup>
            </Form.Group>

            {/* Password */}
            <Form.Group className="mb-4">
              <Form.Label className="small text-white-50 ms-1">
                Password
              </Form.Label>

              <InputGroup>
                <InputGroup.Text
                  className="border-0"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#00ff9d"
                  }}
                >
                  <FontAwesomeIcon icon={faLock} />
                </InputGroup.Text>

                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-white shadow-none"
                  style={{
                    ...inputStyle,
                    borderRight: "none"
                  }}
                  required
                />

                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  className="border-0"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderLeft: "none",
                    color: "rgba(255,255,255,0.7)"
                  }}
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                  />
                </Button>
              </InputGroup>
            </Form.Group>

            {/* Login Submit Button */}
            <motion.button
              type="submit"
              className="btn w-100 fw-bold py-2 rounded-pill mb-3"
              style={{
                background: "linear-gradient(90deg, #00ff9d, #00d4ff)",
                border: "none",
                color: "#0f0c29",
                boxShadow: "0 0 15px rgba(0, 255, 157, 0.4)"
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 25px rgba(0, 255, 157, 0.6)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              Login to Dashboard
            </motion.button>

            {/* Back to Select Role Button */}
            <motion.button
              type="button"
              onClick={() => navigate("/")}
              className="btn w-100 py-2 rounded-pill btn-outline-light d-flex align-items-center justify-content-center gap-2"
              style={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "rgba(255, 255, 255, 0.85)"
              }}
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderColor: "rgba(255, 255, 255, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <FontAwesomeIcon icon={faArrowLeft} size="sm" />
              <span>Back to Select Role</span>
            </motion.button>
          </Form>
        </motion.div>
      </Container>
    </div>
  );
};

export default PmoLogin;