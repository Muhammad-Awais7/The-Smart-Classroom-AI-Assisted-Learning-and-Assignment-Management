// src/components/SupervisorLogin.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supervisorAuth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Container,
  Form,
  Button,
  Navbar,
  InputGroup,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faChalkboardTeacher,
  faLock,
  faEnvelope,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

export default function SupervisorLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      supervisorAuth,
      async (user) => {
        if (user) {
          const docSnap = await getDoc(
            doc(db, "users", user.uid)
          );

          if (
            docSnap.exists() &&
            docSnap.data().role === "supervisor"
          ) {
            navigate("/SupervisorDashboard");
            return;
          }
        }

        setCheckingSession(false);
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential =
        await signInWithEmailAndPassword(
          supervisorAuth,
          email,
          password
        );

      const docSnap = await getDoc(
        doc(db, "users", userCredential.user.uid)
      );

      if (
        !docSnap.exists() ||
        docSnap.data().role !== "supervisor"
      ) {
        setError("Yeh account Supervisor nahi hai");
        return;
      }

      navigate("/SupervisorDashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  };

  const inputStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    backdropFilter: "blur(5px)"
  };

  if (checkingSession) return null;

  return (
    <div
      className="d-flex flex-column min-vh-100 position-relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily:
          "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#fff"
      }}
    >
      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "400px",
          height: "400px",
          background: "#ff00cc",
          filter: "blur(150px)",
          top: "-10%",
          left: "-10%",
          opacity: 0.2,
          zIndex: 0
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 10
        }}
      />

      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "300px",
          height: "300px",
          background: "#303f9f",
          filter: "blur(120px)",
          bottom: "-5%",
          right: "-5%",
          opacity: 0.2,
          zIndex: 0
        }}
        animate={{
          scale: [1, 1.3, 1],
          y: [0, -30, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 12
        }}
      />

      <Navbar
        className="py-3 px-4 shadow-lg"
        style={{
          background:
            "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderBottom:
            "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: 10
        }}
      >
        <Container fluid>
          <Navbar.Brand className="fw-bold text-white fs-4 d-flex align-items-center gap-2">
            <FontAwesomeIcon
              icon={faChalkboardTeacher}
              style={{ color: "#ff00cc" }}
            />

            <span>
              Instructor{" "}
              <span style={{ color: "#ff00cc" }}>
                Login
              </span>
            </span>
          </Navbar.Brand>
        </Container>
      </Navbar>

      <Container
        className="flex-grow-1 d-flex align-items-center justify-content-center"
        style={{ zIndex: 5 }}
      >
        <motion.div
          initial={{
            y: 50,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            duration: 0.8,
            type: "spring"
          }}
          className="p-4 p-md-5 rounded-4 shadow-lg w-100"
          style={{
            maxWidth: "450px",
            background:
              "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(15px)",
            border:
              "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow:
              "0 0 40px rgba(0,0,0,0.5)"
          }}
        >
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "80px",
                height: "80px",
                background:
                  "rgba(255, 0, 204, 0.1)",
                border:
                  "1px solid #ff00cc",
                boxShadow:
                  "0 0 15px rgba(255, 0, 204, 0.3)"
              }}
            >
              <FontAwesomeIcon
                icon={faChalkboardTeacher}
                size="2x"
                style={{
                  color: "#ff00cc"
                }}
              />
            </div>

            <h3 className="fw-bold text-white">
              Welcome Instructor
            </h3>

            <p className="text-white-50 small">
              Manage your courses and students
            </p>
          </div>

          {error && (
            <motion.div
              initial={{
                opacity: 0,
                x: -20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              className="alert alert-danger border-0 shadow-sm mb-4"
              style={{
                background:
                  "rgba(220, 53, 69, 0.2)",
                color: "#ff6b6b"
              }}
            >
              {error}
            </motion.div>
          )}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label className="small text-white-50 ms-1">
                Email Address
              </Form.Label>

              <InputGroup>
                <InputGroup.Text
                  className="border-0"
                  style={{
                    background:
                      "rgba(255,255,255,0.1)",
                    color: "#ff00cc"
                  }}
                >
                  <FontAwesomeIcon
                    icon={faEnvelope}
                  />
                </InputGroup.Text>

                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="instructor@example.com"
                  className="text-white shadow-none"
                  style={inputStyle}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small text-white-50 ms-1">
                Password
              </Form.Label>

              <InputGroup>
                <InputGroup.Text
                  className="border-0"
                  style={{
                    background:
                      "rgba(255,255,255,0.1)",
                    color: "#ff00cc"
                  }}
                >
                  <FontAwesomeIcon
                    icon={faLock}
                  />
                </InputGroup.Text>

                <Form.Control
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="text-white shadow-none"
                  style={{
                    ...inputStyle,
                    borderRight: "none"
                  }}
                  required
                />

                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="border-0"
                  style={{
                    background:
                      "rgba(255, 255, 255, 0.05)",
                    border:
                      "1px solid rgba(255, 255, 255, 0.2)",
                    borderLeft: "none",
                    color:
                      "rgba(255,255,255,0.7)"
                  }}
                >
                  <FontAwesomeIcon
                    icon={
                      showPassword
                        ? faEyeSlash
                        : faEye
                    }
                  />
                </Button>
              </InputGroup>
            </Form.Group>

            <motion.button
              type="submit"
              className="btn w-100 fw-bold py-2 rounded-pill mb-3"
              style={{
                background:
                  "linear-gradient(90deg, #ff00cc, #333399)",
                border: "none",
                color: "#fff",
                boxShadow:
                  "0 0 15px rgba(255, 0, 204, 0.4)"
              }}
              whileHover={{
                scale: 1.02,
                boxShadow:
                  "0 0 25px rgba(255, 0, 204, 0.6)"
              }}
              whileTap={{
                scale: 0.98
              }}
            >
              Login to Dashboard
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigate("/")}
              className="btn w-100 py-2 rounded-pill btn-outline-light d-flex align-items-center justify-content-center gap-2"
              style={{
                borderColor:
                  "rgba(255, 255, 255, 0.2)",
                background:
                  "rgba(255, 255, 255, 0.03)",
                color:
                  "rgba(255, 255, 255, 0.85)"
              }}
              whileHover={{
                scale: 1.02,
                backgroundColor:
                  "rgba(255, 255, 255, 0.1)",
                borderColor:
                  "rgba(255, 255, 255, 0.4)"
              }}
              whileTap={{
                scale: 0.98
              }}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                size="sm"
              />

              <span>
                Back to Select Role
              </span>
            </motion.button>
          </Form>
        </motion.div>
      </Container>
    </div>
  );
}