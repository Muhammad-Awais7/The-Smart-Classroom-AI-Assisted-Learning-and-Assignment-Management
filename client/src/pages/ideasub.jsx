import React, { useState } from 'react';
import { Button, Container, Form, Alert, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';

const ideasub = () => {
  const navigate = useNavigate();

  // Supervisor  data
  const supervisors = [
    { id: 1, name: 'Prof Ahmed', domain: 'AI' },
    { id: 2, name: 'Prof Ali', domain: 'ML' },
    { id: 3, name: 'Prof Taha', domain: 'Blockchain' },
    { id: 4, name: 'Dr Ayesha', domain: 'Cybersecurity' },
    { id: 5, name: 'Prof Fatima', domain: 'IoT' }
  ];

  // past FYP data
  const pastProjects = [
    { title: 'Smart AI Tutor', domain: 'AI', description: 'An AI system for personalized tutoring.' },
    { title: 'Blockchain Voting System', domain: 'Blockchain', description: 'Secure voting using blockchain.' },
    { title: 'IoT Smart Home', domain: 'IoT', description: 'IoT devices to automate home appliances.' }
  ];

  // State variables
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [matchedSupervisors, setMatchedSupervisors] = useState([]);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const checkSimilarity = (desc) => {
    return pastProjects.filter(project =>
      desc.toLowerCase().includes(project.title.toLowerCase()) ||
      desc.toLowerCase().includes(project.description.toLowerCase())
    );
  };

  const handleSubmit = () => {
    if (!title || !domain || !description) {
      alert('Please fill out all fields.');
      return;
    }

    // Find supervisors by domain
    const matched = supervisors.filter(sup => sup.domain.toLowerCase() === domain.toLowerCase());
    setMatchedSupervisors(matched);

    // Check similarity with past projects
    const similar = checkSimilarity(description);
    setSimilarProjects(similar);

    setSubmitted(true);
  };

  return (
    <>
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="dark" variant="dark">
        <Container className="ms-2">
          <Navbar.Brand className="fw-bold"><FaSearch /> Search Spervisor</Navbar.Brand>
          <Button variant="outline-light" onClick={() => navigate("/StudentDashboard")}>
            <FaArrowLeft /> Go to Student Dashboard
          </Button>
        </Container>
      </Navbar>

      <Container className="mt-5 flex-grow-1">
        <Form className="border border-dark rounded p-4 bg-light shadow">
          <Form.Group className="mb-3">
            <Form.Label className="fs-5 fw-bold">Project Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fs-5 fw-bold">Domain</Form.Label>
            <Form.Control
            type="text"
              placeholder="Enter project domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />

            
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fs-5 fw-bold">Short Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe your project briefly"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Button variant="dark" onClick={handleSubmit}>Submit Idea</Button>
        </Form>

        {submitted && (
          <>
            <Alert variant="success" className="mt-4">
             <strong>Your idea has been submitted!</strong>
            </Alert>

            {matchedSupervisors.length > 0 ? (
              <Alert variant="info" className="mt-3">
                <strong>Matching Supervisors:</strong>
                <ul>
                  {matchedSupervisors.map(sup => (
                    <li key={sup.id}>{sup.name} ({sup.domain})</li>
                  ))}
                </ul>
              </Alert>
            ) : (
              <Alert variant="warning" className="mt-3">
                No matching supervisor found for domain <strong>{domain}</strong>
              </Alert>
            )}

            {similarProjects.length > 0 && (
              <Alert variant="danger" className="mt-3">
                <strong>Warning:</strong> Your idea may be similar to the following past projects:
                <ul>
                  {similarProjects.map((proj, index) => (
                    <li key={index}>
                      <strong>{proj.title}</strong> - {proj.description}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
          </>
        )}
      </Container>

      <footer className="bg-secondary text-white text-center py-3 mt-5">
        <Container>
          <p className="mb-0">© 2025 Smart Past FYP Analyzer - Student Panel</p>
        </Container>
      </footer>
    </div>
    </>
  );
};

export default ideasub;



