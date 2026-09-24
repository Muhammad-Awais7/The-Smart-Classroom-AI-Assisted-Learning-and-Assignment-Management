import React, { useState, useEffect } from "react";
import { Container, Form, Navbar, Row, Col } from "react-bootstrap";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBullhorn,
  faPenNib,
  faUsers,
  faPaperPlane,
  faCheckCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function PMOAddAnnouncement() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("pmoAuth") !== "true") {
      navigate("/pmologin");
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    audience: "student",
  });

  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    let visibleTo = [];

    switch (formData.audience) {
      case "student":
        visibleTo = ["student"];
        break;

      case "supervisor":
        visibleTo = ["supervisor"];
        break;

      case "both":
        visibleTo = ["student", "supervisor"];
        break;

      default:
        visibleTo = [];
    }

    try {
      await addDoc(collection(db, "roleAnnouncements"), {
        title: formData.title,
        message: formData.message,
        visibleTo,
        createdBy: "PMO",
        createdAt: serverTimestamp(),
      });

      setStatus({
        type: "success",
        msg: "Announcement posted successfully!",
      });

      setFormData({
        title: "",
        message: "",
        audience: "student",
      });

      setTimeout(() => {
        setStatus(null);
      }, 3000);
    } catch (err) {
      console.error(err);

      setStatus({
        type: "error",
        msg: err.message,
      });
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    backdropFilter: "blur(5px)",
    borderRadius: "10px",
    padding: "12px",
  };

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        background:
          "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
        color: "#fff",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Background */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden"
        style={{
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <div
          className="position-absolute bg-primary rounded-circle"
          style={{
            width: "300px",
            height: "300px",
            top: "-10%",
            left: "-10%",
            filter: "blur(150px)",
            opacity: 0.3,
          }}
        />

        <div
          className="position-absolute bg-danger rounded-circle"
          style={{
            width: "300px",
            height: "300px",
            bottom: "-10%",
            right: "-10%",
            filter: "blur(150px)",
            opacity: 0.2,
          }}
        />
      </div>

      {/* Navbar */}
      <Navbar
        className="py-3 px-4 border-bottom border-white border-opacity-10 sticky-top"
        style={{
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          zIndex: 10,
        }}
      >
        <Container
          fluid
          className="d-flex justify-content-between align-items-center"
        >
          <Navbar.Brand className="fw-bold text-white d-flex align-items-center">
            <div
              className="bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                width: 40,
                height: 40,
              }}
            >
              <FontAwesomeIcon
                icon={faBullhorn}
                className="text-info"
              />
            </div>

            <span>
              PMO <span className="text-white-50">/ New Announcement</span>
            </span>
          </Navbar.Brand>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/PMODashboard")}
            className="btn btn-outline-light rounded-pill px-3"
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="me-2"
            />
            Back
          </motion.button>
        </Container>
      </Navbar>

      <Container
        className="py-5 d-flex justify-content-center align-items-center flex-grow-1"
        style={{
          position: "relative",
          zIndex: 5,
        }}
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="w-100 p-5 rounded-4 shadow-lg"
          style={{
            maxWidth: "700px",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          <h3 className="fw-bold mb-4 text-center">
            Create Announcement
          </h3>

          <AnimatePresence>
            {status && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                className={`alert ${
                  status.type === "success"
                    ? "alert-success"
                    : "alert-danger"
                } d-flex align-items-center mb-4 border-0`}
              >
                <FontAwesomeIcon
                  icon={
                    status.type === "success"
                      ? faCheckCircle
                      : faExclamationCircle
                  }
                  className="me-2 fs-5"
                />
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              {/* Title */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold">
                    <FontAwesomeIcon
                      icon={faPenNib}
                      className="me-2"
                    />
                    Title
                  </Form.Label>

                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="e.g. Mid-Term Evaluation Schedule"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    className="text-white shadow-none"
                  />
                </Form.Group>
              </Col>

              {/* Audience */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold">
                    <FontAwesomeIcon
                      icon={faUsers}
                      className="me-2"
                    />
                    Target Audience
                  </Form.Label>

                  <Form.Select
                    name="audience"
                    value={formData.audience}
                    onChange={handleChange}
                    style={inputStyle}
                    className="text-white shadow-none"
                  >
                    <option
                      value="student"
                      style={{ color: "black" }}
                    >
                      🎓 Students
                    </option>

                    <option
                      value="supervisor"
                      style={{ color: "black" }}
                    >
                      👨‍🏫 Supervisors
                    </option>

                    <option
                      value="both"
                      style={{ color: "black" }}
                    >
                      👥 Students & Supervisors
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Message */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold">
                    Message Content
                  </Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    placeholder="Type your announcement details here..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    style={{
                      ...inputStyle,
                      resize: "none",
                    }}
                    className="text-white shadow-none"
                  />
                </Form.Group>
              </Col>
            </Row>

            <motion.button
              type="submit"
              whileHover={{
                scale: 1.02,
                boxShadow:
                  "0 0 20px rgba(13,202,240,0.5)",
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="btn btn-info w-100 mt-4 py-3 fw-bold text-white rounded-3"
              style={{
                background:
                  "linear-gradient(45deg,#0dcaf0,#0d6efd)",
                border: "none",
                fontSize: "1.1rem",
              }}
            >
              <FontAwesomeIcon
                icon={faPaperPlane}
                className="me-2"
              />
              Post Announcement
            </motion.button>
          </Form>
        </motion.div>
      </Container>
    </div>
  );
}