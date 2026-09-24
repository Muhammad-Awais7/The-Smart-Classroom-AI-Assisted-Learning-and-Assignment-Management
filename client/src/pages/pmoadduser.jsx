import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Navbar } from "react-bootstrap";

import { auth, db } from "../firebase";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { getApps, initializeApp } from "firebase/app";

import {
  collection,
  setDoc,
  doc,
  getDocs,
  serverTimestamp,
  query,
  where,
  getFirestore
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserPlus,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield
} from "lucide-react";


// =====================================================
// SECONDARY FIREBASE AUTH
// =====================================================
//
// IMPORTANT:
// createUserWithEmailAndPassword() normally signs in
// the newly created user automatically.
//
// We use a separate Firebase app/auth instance here,
// so PMO ka current login session change nahi hoga.
// =====================================================

const secondaryApp =
  getApps().find(
    (app) => app.name === "SecondaryApp"
  ) ||
  initializeApp(
    {
      apiKey: "AIzaSyBKbXHSSBNNsBTK8mRmTbvTzAfibXHXnM8",
      authDomain: "smart-classroom-73c2b.firebaseapp.com",
      projectId: "smart-classroom-73c2b",
      storageBucket: "smart-classroom-73c2b.firebasestorage.app",
      messagingSenderId: "667172361340",
      appId: "1:667172361340:web:1e03cc48c798d5973f25f9",
      measurementId: "G-59YYSQCK4Y"
    },
    "SecondaryApp"
  );

const secondaryAuth = getAuth(secondaryApp);

// =====================================================
// IMPORTANT FIX:
// New user Firestore ke andar isi secondary app ki auth
// session se likha jayega (primary "db" se nahi), warna
// Firestore rules ko request.auth null milta hai aur
// "Missing or insufficient permissions" error aata hai.
// =====================================================
const secondaryDb = getFirestore(secondaryApp);


export default function PMOAddUser() {
  const navigate = useNavigate();


  // =====================================================
  // PMO SESSION CHECK
  // =====================================================

  useEffect(() => {
    if (localStorage.getItem("pmoAuth") !== "true") {
      navigate("/pmologin", { replace: true });
    }
  }, [navigate]);


  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    supervisorId: ""
  });


  const [supervisors, setSupervisors] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);


  // =====================================================
  // FETCH SUPERVISORS
  // =====================================================

  useEffect(() => {
    async function fetchSupervisors() {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "supervisor")
        );

        const snapshot = await getDocs(q);

        const supervisorList = snapshot.docs.map(
          (supervisorDoc) => ({
            id: supervisorDoc.id,
            ...supervisorDoc.data()
          })
        );

        setSupervisors(supervisorList);

      } catch (err) {
        console.error(
          "Error fetching supervisors:",
          err
        );
      }
    }

    fetchSupervisors();
  }, []);


  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };


  // =====================================================
  // CREATE USER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError(false);


    // Make sure PMO is still logged in
    if (localStorage.getItem("pmoAuth") !== "true") {
      navigate("/pmologin", { replace: true });
      return;
    }


    try {

      // =================================================
      // CREATE USER USING SECONDARY AUTH
      // =================================================
      //
      // PMO account remains logged in.
      // New account is created separately.
      //

      const userCredential =
        await createUserWithEmailAndPassword(
          secondaryAuth,
          formData.email.trim(),
          formData.password
        );


      const uid = userCredential.user.uid;


      // =================================================
      // SUPERVISOR ID
      // =================================================

      const finalSupervisorId =
        formData.role === "student" &&
        formData.supervisorId
          ? formData.supervisorId
          : null;


      // =================================================
      // SAVE USER DATA IN FIRESTORE
      // =================================================
      //
      // secondaryDb use hota hai (secondaryAuth se banaya
      // gaya) taake request.auth.uid naye user ke uid se
      // match ho aur Firestore rules permission dein.
      //

      await setDoc(
        doc(secondaryDb, "users", uid),
        {
          uid,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          supervisorId: finalSupervisorId,
          createdAt: serverTimestamp()
        }
      );


      // =================================================
      // SIGN OUT SECONDARY AUTH ONLY
      // =================================================
      //
      // This does NOT logout the PMO account.
      //

      await signOut(secondaryAuth);


      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        `${formData.role.toUpperCase()} added successfully!`
      );

      setError(false);


      // Reset form

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        supervisorId: ""
      });


    } catch (err) {

      console.error(
        "Create user error:",
        err
      );


      setError(true);


      // Firebase friendly error messages

      if (err.code === "auth/email-already-in-use") {

        setMessage(
          "This email is already registered."
        );

      } else if (err.code === "auth/invalid-email") {

        setMessage(
          "Please enter a valid email address."
        );

      } else if (err.code === "auth/weak-password") {

        setMessage(
          "Password must be at least 6 characters."
        );

      } else {

        setMessage(
          err.message || "Failed to create user."
        );
      }


      // Make sure secondary auth is logged out

      try {
        await signOut(secondaryAuth);
      } catch (signOutError) {
        console.error(
          "Secondary logout error:",
          signOutError
        );
      }
    }
  };


  // =====================================================
  // CUSTOM INPUT STYLE
  // =====================================================

  const inputStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    backdropFilter: "blur(5px)"
  };


  // =====================================================
  // UI
  // =====================================================

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

      {/* --- Background Orbs --- */}

      <motion.div
        className="position-absolute rounded-circle"
        style={{
          width: "400px",
          height: "400px",
          background: "#00ff9d",
          filter: "blur(150px)",
          top: "-10%",
          right: "-10%",
          opacity: 0.15,
          zIndex: 0
        }}
        animate={{
          scale: [1, 1.2, 1]
        }}
        transition={{
          repeat: Infinity,
          duration: 8
        }}
      />


      {/* --- Navbar --- */}

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

        <Container
          fluid
          className="d-flex justify-content-between align-items-center"
        >

          <Navbar.Brand
            className="fw-bold text-white d-flex align-items-center gap-2"
          >

            <UserPlus color="#00ff9d" />

            <span>
              Admin{" "}
              <span style={{ color: "#00ff9d" }}>
                / Add User
              </span>
            </span>

          </Navbar.Brand>


          <motion.button
            whileHover={{
              scale: 1.05
            }}
            whileTap={{
              scale: 0.95
            }}
            className="btn btn-sm btn-outline-light d-flex align-items-center gap-2 rounded-pill px-3"
            onClick={() =>
              navigate("/PMODashboard")
            }
            style={{
              borderColor:
                "rgba(255,255,255,0.3)"
            }}
          >

            <ArrowLeft size={16} />

            Back to Dashboard

          </motion.button>

        </Container>

      </Navbar>


      {/* --- Main Content --- */}

      <Container
        className="py-5 d-flex justify-content-center align-items-center flex-grow-1"
        style={{
          zIndex: 5
        }}
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
            maxWidth: "700px",
            background:
              "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(15px)",
            border:
              "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow:
              "0 0 40px rgba(0,0,0,0.5)"
          }}
        >

          <h2 className="text-center mb-4 fw-bold">
            Create New Account
          </h2>


          {/* Message */}

          {message && (
            <motion.div
              initial={{
                opacity: 0,
                x: -20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              className={`alert ${
                error
                  ? "alert-danger"
                  : "alert-success"
              } border-0 shadow-sm`}
            >
              {message}
            </motion.div>
          )}


          <Form onSubmit={handleSubmit}>

            <Row className="g-3">

              {/* Name */}

              <Col md={6}>

                <Form.Label className="small text-white-50 ms-1">
                  Full Name
                </Form.Label>

                <div className="input-group">

                  <span
                    className="input-group-text border-0"
                    style={{
                      background:
                        "rgba(255,255,255,0.1)",
                      color: "#00ff9d"
                    }}
                  >
                    <User size={18} />
                  </span>

                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Enter your Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    className="text-white shadow-none focus-ring"
                  />

                </div>

              </Col>


              {/* Email */}

              <Col md={6}>

                <Form.Label className="small text-white-50 ms-1">
                  Email Address
                </Form.Label>

                <div className="input-group">

                  <span
                    className="input-group-text border-0"
                    style={{
                      background:
                        "rgba(255,255,255,0.1)",
                      color: "#00ff9d"
                    }}
                  >
                    <Mail size={18} />
                  </span>

                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    className="text-white shadow-none"
                  />

                </div>

              </Col>


              {/* Password */}

              <Col md={6}>

                <Form.Label className="small text-white-50 ms-1">
                  Password
                </Form.Label>

                <div className="input-group">

                  <span
                    className="input-group-text border-0"
                    style={{
                      background:
                        "rgba(255,255,255,0.1)",
                      color: "#00ff9d"
                    }}
                  >
                    <Lock size={18} />
                  </span>

                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    className="text-white shadow-none"
                  />

                </div>

              </Col>


              {/* Role */}

              <Col md={6}>

                <Form.Label className="small text-white-50 ms-1">
                  Assign Role
                </Form.Label>

                <div className="input-group">

                  <span
                    className="input-group-text border-0"
                    style={{
                      background:
                        "rgba(255,255,255,0.1)",
                      color: "#00ff9d"
                    }}
                  >
                    <Shield size={18} />
                  </span>

                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    className="text-white shadow-none"
                  >

                    <option
                      value=""
                      style={{
                        color: "black"
                      }}
                    >
                      Select Role
                    </option>

                    <option
                      value="student"
                      style={{
                        color: "black"
                      }}
                    >
                      Student
                    </option>

                    <option
                      value="supervisor"
                      style={{
                        color: "black"
                      }}
                    >
                      Instructor
                    </option>

                  </Form.Select>

                </div>

              </Col>

            </Row>


            {/* Submit Button */}

            <motion.button
              type="submit"
              className="btn w-100 mt-4 fw-bold py-2 rounded-pill"
              style={{
                background:
                  "linear-gradient(90deg, #00ff9d, #00d4ff)",
                border: "none",
                color: "#0f0c29",
                boxShadow:
                  "0 0 15px rgba(0, 255, 157, 0.4)"
              }}
              whileHover={{
                scale: 1.02,
                boxShadow:
                  "0 0 25px rgba(0, 255, 157, 0.6)"
              }}
              whileTap={{
                scale: 0.98
              }}
            >

              <UserPlus
                size={20}
                className="me-2"
              />

              Create User

            </motion.button>

          </Form>

        </motion.div>

      </Container>

    </div>
  );
}