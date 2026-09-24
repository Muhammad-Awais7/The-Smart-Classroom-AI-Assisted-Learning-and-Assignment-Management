// src/App.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// ======================================================
// Pages
// ======================================================

import SignIn from "./pages/SignIn";
import MainRoles from "./pages/MainRoles";

import StudentDashboard from "./pages/StudentDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import PMODashboard from "./pages/PMODashboard";

import SupervisorLogin from "./pages/supervisorlogin";
import SupNot from "./pages/supnot";
import StudentReceive from "./pages/studentreceive";
import PMOADD from "./pages/pmoadduser";
import StudLog from "./pages/studentlogin";
import PmoN from "./pages/pmonoti";
import PMOLog from "./pages/pmologin";

import PlagrismStud from "./pages/plagrismstud";
import SupervisorCreateClass from "./pages/SupervisorCreateClass";
import SupervisorClassView from "./pages/SupervisorClassView";
import StudentJoinClass from "./pages/StudentJoinClass";
import StudentClassView from "./pages/StudentClassView";
import SupervisorClassList from "./pages/SupervisorClassList";
import StudentClassList from "./pages/StudentClassList";
import CompilerPage from "./pages/CompilerPage";
import SupervisorAnnouncements from "./pages/SupervisorAnnouncements";
import SupervisorAssignments from "./pages/SupervisorAssignments";
import SupervisorMaterials from "./pages/SupervisorMaterials";
import StudentAnnouncements from "./pages/StudentAnnouncements";
import StudentAssignments from "./pages/StudentAssignments";
import StudentMaterials from "./pages/StudentMaterials";
import PlagiarismChecker from "./pages/PlagiarismChecker";
import StudentQA from "./pages/StudentQA";
import SupervisorQA from "./pages/SupervisorQA";

// ======================================================
// Authentication Context
// ======================================================

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!mounted) return;

        // ==================================================
        // No Firebase user
        // ==================================================

        if (!currentUser) {
          if (mounted) {
            setUser(null);
            setRole(null);
            setLoading(false);
          }

          return;
        }

        // ==================================================
        // Firebase user found
        // ==================================================

        try {
          const userRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const userDoc = await getDoc(userRef);

          if (!mounted) return;

          // Firebase user preserve karo
          setUser(currentUser);

          // Firestore role
          if (userDoc.exists()) {
            const userData = userDoc.data();

            setRole(
              typeof userData.role === "string"
                ? userData.role.toLowerCase()
                : null
            );
          } else {
            setRole(null);
          }

        } catch (error) {
          console.error(
            "Authentication / role check error:",
            error
          );

          if (!mounted) return;

          // Firebase session destroy nahi karna
          setUser(currentUser);
          setRole(null);

        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ======================================================
// Authentication Hook
// ======================================================

const useAuth = () => {
  return useContext(AuthContext);
};

// ======================================================
// Loading Screen
// ======================================================

const AuthLoading = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        color: "#fff",
        fontFamily:
          "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <div
        style={{
          textAlign: "center"
        }}
      >
        <div
          style={{
            width: "45px",
            height: "45px",
            border: "4px solid rgba(255,255,255,0.2)",
            borderTop:
              "4px solid #00d4ff",
            borderRadius: "50%",
            animation:
              "authSpin 0.8s linear infinite",
            margin: "0 auto 15px"
          }}
        />

        <div
          style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.75)"
          }}
        >
          Restoring session...
        </div>

        <style>
          {`
            @keyframes authSpin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

// ======================================================
// Protected Route
// ======================================================

const ProtectedRoute = ({
  children,
  allowedRole
}) => {
  const {
    user,
    role,
    loading
  } = useAuth();

  // Firebase session restore hone do
  if (loading) {
    return <AuthLoading />;
  }

  // ==================================================
  // No Firebase session
  // ==================================================

  if (!user) {
    if (allowedRole === "student") {
      return (
        <Navigate
          to="/studentlogin"
          replace
        />
      );
    }

    if (allowedRole === "supervisor") {
      return (
        <Navigate
          to="/supervisorlogin"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/main"
        replace
      />
    );
  }

  // ==================================================
  // User exists but role is not available
  // ==================================================

  if (!role) {
    return <AuthLoading />;
  }

  // ==================================================
  // Role mismatch
  // ==================================================

  if (role !== allowedRole) {
    if (role === "student") {
      return (
        <Navigate
          to="/StudentDashboard"
          replace
        />
      );
    }

    if (role === "supervisor") {
      return (
        <Navigate
          to="/SupervisorDashboard"
          replace
        />
      );
    }

    if (
      role === "admin" ||
      role === "pmo"
    ) {
      return (
        <Navigate
          to="/PMODashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/main"
        replace
      />
    );
  }

  // ==================================================
  // Authenticated + correct role
  // ==================================================

  return children;
};

// ======================================================
// PMO Protected Route
// ======================================================

const PMOProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkPMOSession = () => {
      try {
        const pmoAuth =
          localStorage.getItem("pmoAuth");

        setAuthenticated(
          pmoAuth === "true"
        );

      } catch (error) {
        console.error(
          "PMO session check error:",
          error
        );

        setAuthenticated(false);

      } finally {
        setChecking(false);
      }
    };

    checkPMOSession();
  }, []);

  if (checking) {
    return <AuthLoading />;
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/pmologin"
        replace
      />
    );
  }

  return children;
};

// ======================================================
// Main Route
// ======================================================
// Agar user already login hai to /main par
// MainRoles screen dobara nahi dikhegi.
// User apne dashboard par chala jayega.
// ======================================================

const MainRoute = () => {
  const {
    user,
    role,
    loading
  } = useAuth();

  // Firebase session restore ho rahi hai
  if (loading) {
    return <AuthLoading />;
  }

  // ==================================================
  // No Firebase user
  // Main role selection screen show hogi
  // ==================================================

  if (!user) {
    return <MainRoles />;
  }

  // ==================================================
  // User hai lekin role load nahi hua
  // ==================================================

  if (!role) {
    return <AuthLoading />;
  }

  // ==================================================
  // Student
  // ==================================================

  if (role === "student") {
    return (
      <Navigate
        to="/StudentDashboard"
        replace
      />
    );
  }

  // ==================================================
  // Supervisor / Instructor
  // ==================================================

  if (role === "supervisor") {
    return (
      <Navigate
        to="/SupervisorDashboard"
        replace
      />
    );
  }

  // ==================================================
  // Admin / PMO
  // ==================================================

  if (
    role === "admin" ||
    role === "pmo"
  ) {
    return (
      <Navigate
        to="/PMODashboard"
        replace
      />
    );
  }

  // Unknown role
  return <MainRoles />;
};

// ======================================================
// Login Route
// ======================================================
// Agar user already login hai to login screen dobara
// nahi khulegi.
// ======================================================

const LoginRoute = ({ children }) => {
  const {
    user,
    role,
    loading
  } = useAuth();

  // Firebase session restore
  if (loading) {
    return <AuthLoading />;
  }

  // ==================================================
  // User login nahi hai
  // Login page show karo
  // ==================================================

  if (!user) {
    return children;
  }

  // ==================================================
  // Student already logged in
  // ==================================================

  if (role === "student") {
    return (
      <Navigate
        to="/StudentDashboard"
        replace
      />
    );
  }

  // ==================================================
  // Supervisor already logged in
  // ==================================================

  if (role === "supervisor") {
    return (
      <Navigate
        to="/SupervisorDashboard"
        replace
      />
    );
  }

  // ==================================================
  // Admin / PMO
  // ==================================================

  if (
    role === "admin" ||
    role === "pmo"
  ) {
    return (
      <Navigate
        to="/PMODashboard"
        replace
      />
    );
  }

  return children;
};

// ======================================================
// App Routes
// ======================================================

const AppRoutes = () => {
  return (
    <Routes>

      {/* ==================================================
          Public / Entry Routes
      ================================================== */}

      <Route
        path="/"
        element={<SignIn />}
      />

      {/* ==================================================
          MAIN ROLE SELECTION
          Already logged-in user dashboard par jayega
      ================================================== */}

      <Route
        path="/main"
        element={<MainRoute />}
      />

      {/* ==================================================
          Student Login
      ================================================== */}

      <Route
        path="/studentlogin"
        element={
          <LoginRoute>
            <StudLog />
          </LoginRoute>
        }
      />

      {/* ==================================================
          Supervisor Login
      ================================================== */}

      <Route
        path="/supervisorlogin"
        element={
          <LoginRoute>
            <SupervisorLogin />
          </LoginRoute>
        }
      />

      {/* ==================================================
          PMO Login
          PMO currently localStorage session use karta hai.
      ================================================== */}

      <Route
        path="/pmologin"
        element={<PMOLog />}
      />

      {/* ==================================================
          Student Dashboard
      ================================================== */}

      <Route
        path="/StudentDashboard"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* ==================================================
          Supervisor Dashboard
      ================================================== */}

      <Route
        path="/SupervisorDashboard"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupervisorDashboard />
          </ProtectedRoute>
        }
      />

      {/* ==================================================
          PMO Dashboard
      ================================================== */}

      <Route
        path="/PMODashboard"
        element={
          <PMOProtectedRoute>
            <PMODashboard />
          </PMOProtectedRoute>
        }
      />

      {/* ==================================================
          Supervisor Actions
      ================================================== */}

      <Route
        path="/supnot"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupNot />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-class"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupervisorCreateClass />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/class/:classId"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupervisorClassView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/my-classes"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupervisorClassList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/class/:classId/compiler"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <CompilerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/class/:classId/announcements"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupervisorAnnouncements />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/class/:classId/assignments"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupervisorAssignments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/class/:classId/materials"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupervisorMaterials />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/class/:classId/plagiarism"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <PlagiarismChecker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor/class/:classId/qa"
        element={
          <ProtectedRoute
            allowedRole="supervisor"
          >
            <SupervisorQA />
          </ProtectedRoute>
        }
      />

      {/* ==================================================
          Student Actions
      ================================================== */}

      <Route
        path="/studentreceive"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentReceive />
          </ProtectedRoute>
        }
      />

      <Route
        path="/plagrismstud"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <PlagrismStud />
          </ProtectedRoute>
        }
      />

      <Route
        path="/join-class"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentJoinClass />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/class/:classId"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentClassView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/my-classes"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentClassList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/class/:classId/announcements"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentAnnouncements />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/class/:classId/assignments"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentAssignments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/class/:classId/materials"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentMaterials />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/class/:classId/qa"
        element={
          <ProtectedRoute
            allowedRole="student"
          >
            <StudentQA />
          </ProtectedRoute>
        }
      />

      {/* ==================================================
          PMO Actions
      ================================================== */}

      <Route
        path="/pmoadduser"
        element={
          <PMOProtectedRoute>
            <PMOADD />
          </PMOProtectedRoute>
        }
      />

      <Route
        path="/pmonoti"
        element={
          <PMOProtectedRoute>
            <PmoN />
          </PMOProtectedRoute>
        }
      />

      {/* ==================================================
          Fallback
      ================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
};

// ======================================================
// Main App
// ======================================================

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;