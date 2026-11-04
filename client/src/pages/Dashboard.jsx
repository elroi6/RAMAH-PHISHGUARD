import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  ScanSearch,
  History,
  UserCircle,
  LockKeyhole,
  Activity,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <ShieldCheck size={30} />
          <span>RAMAH-PHISHGUARD</span>
        </Link>

        <nav className="dashboard-navigation">
          <p className="dashboard-nav-label">MAIN MENU</p>

          <a href="#overview" className="dashboard-nav-item active">
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a href="#scan" className="dashboard-nav-item">
            <ScanSearch size={19} />
            URL Scanner
          </a>

          <a href="#history" className="dashboard-nav-item">
            <History size={19} />
            Scan History
          </a>

          <p className="dashboard-nav-label">ACCOUNT</p>

          <a href="#profile" className="dashboard-nav-item">
            <UserCircle size={19} />
            My Profile
          </a>
        </nav>

        <button
          className="dashboard-logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      <main className="dashboard-content" id="overview">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">RAMAH TECHNOLOGIES</p>
            <h1>Security Dashboard</h1>
            <p>Monitor your digital security from one place.</p>
          </div>

          <div className="dashboard-user">
            <UserCircle size={35} />
            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.role || "user"}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-welcome">
          <div>
            <span>WELCOME TO PHISHGUARD</span>
            <h2>Hello, {user?.name?.split(" ")[0] || "there"}!</h2>
            <p>
              Your account is ready. Start checking suspicious
              URLs and learning how to stay protected online.
            </p>
          </div>

          <ShieldCheck size={75} />
        </section>

        <section className="dashboard-stats">
          <div className="dashboard-stat-card">
            <ScanSearch size={23} />
            <span>Total Scans</span>
            <strong>0</strong>
            <small>Your scanning activity</small>
          </div>

          <div className="dashboard-stat-card">
            <Activity size={23} />
            <span>Threats Detected</span>
            <strong>0</strong>
            <small>Threats identified</small>
          </div>

          <div className="dashboard-stat-card">
            <History size={23} />
            <span>Recent Activity</span>
            <strong>0</strong>
            <small>Your latest scans</small>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Choose what you want to do next.</p>
            </div>
          </div>

          <div className="dashboard-actions">
            <div className="dashboard-action-card">
              <ScanSearch size={28} />
              <h3>Scan a URL</h3>
              <p>
                Check a suspicious link for potential phishing
                indicators.
              </p>
              <span>Coming soon</span>
            </div>

            <div className="dashboard-action-card">
              <History size={28} />
              <h3>Scan History</h3>
              <p>
                Review your previous URL scans and their results.
              </p>
              <span>Coming soon</span>
            </div>

            <div className="dashboard-action-card">
              <LockKeyhole size={28} />
              <h3>Security Awareness</h3>
              <p>
                Learn how to recognize phishing and online scams.
              </p>
              <span>Coming soon</span>
            </div>
          </div>
        </section>

        <footer className="dashboard-footer">
          © {new Date().getFullYear()} RAMAH TECHNOLOGIES.
          DETECT THREATS. PROTECT PEOPLE.
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
