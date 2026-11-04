
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

import {
  ShieldCheck,
  LockKeyhole,
  Activity,
  Globe,
  ArrowRight,
  ShieldAlert,
  ScanSearch,
} from "lucide-react";

import { checkBackendHealth } from "./services/api";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function LandingPage() {
  const [backendStatus, setBackendStatus] = useState("checking");
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const data = await checkBackendHealth();

        setBackendStatus("connected");
        setBackendMessage(data.message);
      } catch (error) {
        setBackendStatus("disconnected");
        setBackendMessage(
          error.response?.data?.message ||
          "Unable to connect to the backend"
        );
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <ShieldCheck size={27} />
          </div>

          <div>
            <h1>RAMAH<span>-PHISHGUARD</span></h1>
            <p>BY RAMAH TECHNOLOGIES</p>
          </div>
        </Link>

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#status">System Status</a>
        </nav>

        <Link to="/register" className="nav-button">
          Get Started <ArrowRight size={16} />
        </Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot" />
              CYBERSECURITY PROTECTION PLATFORM
            </div>

            <h2>
              Detect Threats.
              <br />
              <span>Protect People.</span>
            </h2>

            <p className="hero-description">
              Take control of your digital safety. RAMAH-PHISHGUARD
              is being built to help identify suspicious URLs,
              understand phishing threats, and promote safer
              browsing across Ethiopia.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="primary-button">
                Get Started <ArrowRight size={18} />
              </Link>

              <a href="#about" className="secondary-button">
                Learn More
              </a>
            </div>

            <div className="trust-note">
              <LockKeyhole size={15} />
              Built with security and privacy in mind
            </div>
          </div>

          <div className="hero-visual">
            <div className="shield-card">
              <div className="shield-glow">
                <ShieldCheck size={100} strokeWidth={1.2} />
              </div>

              <div className="visual-label">
                <span className="status-dot" />
                SECURITY FIRST
              </div>

              <div className="visual-bottom">
                <span>RAMAH-PHISHGUARD</span>
                <span>01 / 2026</span>
              </div>
            </div>

            <div className="floating-card floating-top">
              <ShieldAlert size={19} />
              <span>Threat awareness</span>
            </div>

            <div className="floating-card floating-bottom">
              <Activity size={19} />
              <span>Intelligent analysis</span>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <span>WHAT WE ARE BUILDING</span>
            <h2>Security that starts with awareness.</h2>
            <p>
              Tools and knowledge to help people make safer
              decisions online.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">
                <ScanSearch size={25} />
              </div>
              <h3>URL Threat Detection</h3>
              <p>
                Analyze suspicious URLs and identify potentially
                dangerous indicators.
              </p>
              <span className="feature-label">IN DEVELOPMENT</span>
            </article>

            <article className="feature-card">
              <div className="feature-icon">
                <ShieldAlert size={25} />
              </div>
              <h3>Threat Intelligence</h3>
              <p>
                Identify potential impersonation and suspicious
                online activity.
              </p>
              <span className="feature-label">IN DEVELOPMENT</span>
            </article>

            <article className="feature-card">
              <div className="feature-icon">
                <Globe size={25} />
              </div>
              <h3>Cyber Awareness</h3>
              <p>
                Learn to recognize phishing, scams, and common
                online security risks.
              </p>
              <span className="feature-label">IN DEVELOPMENT</span>
            </article>
          </div>
        </section>

        <section className="system-status" id="status">
          <div>
            <span className="section-eyebrow">DEVELOPMENT ENVIRONMENT</span>
            <h2>System connectivity</h2>
            <p>Live connection to the RAMAH-PHISHGUARD backend.</p>
          </div>

          <div className="connection-card">
            <div className="connection-indicator">
              <span
                className={`status-dot ${
                  backendStatus === "connected"
                    ? "online"
                    : backendStatus === "disconnected"
                    ? "offline"
                    : "checking"
                }`}
              />

              <div>
                <strong>
                  {backendStatus === "connected"
                    ? "Backend Connected"
                    : backendStatus === "disconnected"
                    ? "Backend Disconnected"
                    : "Checking Connection"}
                </strong>

                <p>
                  {backendMessage ||
                    "Checking Express API availability..."}
                </p>
              </div>
            </div>

            <button
              className="refresh-button"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-icon">
            <ShieldCheck size={35} />
          </div>

          <h2>Think Before You Click.</h2>

          <p>
            A cybersecurity initiative by RAMAH TECHNOLOGIES,
            developed to promote safer digital experiences
            and improve phishing awareness in Ethiopia.
          </p>

          <span>BUILD SMART. STAY SECURE.</span>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          RAMAH-PHISHGUARD
          <span> BY RAMAH TECHNOLOGIES</span>
        </div>

        <p>
          © {new Date().getFullYear()} RAMAH TECHNOLOGIES.
          All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
