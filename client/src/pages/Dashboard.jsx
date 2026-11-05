
import { useCallback, useEffect, useState } from "react";
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
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import { scanUrl, getMyScans } from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [scans, setScans] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await getMyScans(page, 10);

      setScans(response.data.scans);
      setPagination(response.data.pagination);
    } catch (err) {
      setHistoryError(
        err.response?.data?.message ||
          "Unable to load your scan history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory(1);
    }, 0);

    return () => clearTimeout(timer);
  }, [loadHistory]);
  const handleScan = async (event) => {
    event.preventDefault();

    const submittedUrl = url.trim();

    if (!submittedUrl) {
      setError("Please enter a URL to scan.");
      return;
    }

    setScanning(true);
    setError("");
    setResult(null);

    try {
      const response = await scanUrl(submittedUrl);
      setResult(response.data);
      await loadHistory(1);
    } catch (err) {
      const responseData = err.response?.data;

      if (responseData?.data) {
        setResult(responseData.data);
        await loadHistory(1);
      } else {
        setError(
          responseData?.message ||
            "Unable to complete the scan. Please try again."
        );
      }
    } finally {
      setScanning(false);
    }
  };

  const getRiskClass = (level) => {
    switch (level) {
      case "LOW":
        return "risk-low";
      case "MODERATE":
        return "risk-moderate";
      case "HIGH":
        return "risk-high";
      case "CRITICAL":
        return "risk-critical";
      default:
        return "";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const handlePageChange = (page) => {
    if (
      page >= 1 &&
      page <= pagination.totalPages &&
      page !== pagination.page
    ) {
      loadHistory(page);
    }
  };

  const threatsOnPage = scans.filter(
    (scan) =>
      scan.riskLevel === "HIGH" ||
      scan.riskLevel === "CRITICAL"
  ).length;

  const latestActivity = scans.length
    ? formatDate(scans[0].createdAt)
    : "No activity yet";

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

        <button className="dashboard-logout" onClick={handleLogout}>
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
              Check suspicious links, understand potential threats,
              and make safer decisions online.
            </p>
          </div>

          <ShieldCheck size={75} />
        </section>

        <section className="dashboard-section scanner-section" id="scan">
          <div className="dashboard-section-heading">
            <div>
              <h2>URL Security Scanner</h2>
              <p>
                Analyze a URL for suspicious indicators and security risks.
              </p>
            </div>
          </div>

          <form className="scanner-form" onSubmit={handleScan}>
            <label htmlFor="scan-url">Enter URL to analyze</label>

            <div className="scanner-input-group">
              <Globe size={20} />

              <input
                id="scan-url"
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                maxLength={2048}
                disabled={scanning}
                autoComplete="url"
              />

              <button type="submit" disabled={scanning}>
                {scanning ? (
                  <>
                    <LoaderCircle size={18} className="scanner-spinner" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanSearch size={18} />
                    Scan URL
                  </>
                )}
              </button>
            </div>

            <small>
              Only HTTP and HTTPS URLs are supported. Do not submit private
              links containing passwords or sensitive tokens.
            </small>
          </form>

          {error && (
            <div className="scanner-error" role="alert">
              <AlertTriangle size={19} />
              {error}
            </div>
          )}

          {result && (
            <div className="scanner-result">
              <div className="scanner-result-heading">
                <div>
                  <span className="result-eyebrow">SCAN RESULT</span>
                  <h3>Analysis completed</h3>
                </div>

                {result.valid ? (
                  <CheckCircle2 size={27} />
                ) : (
                  <AlertTriangle size={27} />
                )}
              </div>

              <div className="result-url">
                <Globe size={17} />
                <span>{result.url}</span>
              </div>

              {result.valid && result.risk && (
                <>
                  <div className="risk-overview">
                    <div>
                      <span>Risk score</span>
                      <strong>
                        {result.risk.score}
                        <small>/100</small>
                      </strong>
                    </div>

                    <span
                      className={`risk-badge ${getRiskClass(result.risk.level)}`}
                    >
                      {result.risk.level}
                    </span>
                  </div>

                  <p className="risk-summary">{result.risk.summary}</p>

                  <div className="result-findings">
                    <h4>
                      Detection findings ({result.findings?.length || 0})
                    </h4>

                    {result.findings?.length > 0 ? (
                      result.findings.map((finding, index) => (
                        <div
                          className="finding-item"
                          key={`${finding.code}-${index}`}
                        >
                          <AlertTriangle size={17} />
                          <div>
                            <strong>
                              {finding.code.replaceAll("_", " ")}
                            </strong>
                            <p>{finding.message}</p>
                          </div>
                          <span>{finding.severity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="no-findings">
                        No suspicious URL structure indicators were detected.
                        This does not prove the URL is safe.
                      </p>
                    )}
                  </div>
                </>
              )}

              {!result.valid && (
                <p className="scanner-error">
                  The submitted URL is invalid and could not be analyzed.
                </p>
              )}

              {result.inspection && (
                <div className="inspection-status">
                  <strong>HTTP inspection:</strong>
                  <span>{result.inspection.status}</span>

                  {result.inspection.httpStatusCode && (
                    <span>
                      HTTP {result.inspection.httpStatusCode}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="dashboard-stats">
          <div className="dashboard-stat-card">
            <ScanSearch size={23} />
            <span>Total Scans</span>
            <strong>
              {historyLoading ? "..." : pagination.total}
            </strong>
            <small>All scans in your account</small>
          </div>

          <div className="dashboard-stat-card">
            <Activity size={23} />
            <span>Threats Detected</span>
            <strong>
              {historyLoading ? "..." : threatsOnPage}
            </strong>
            <small>High/critical on current page</small>
          </div>

          <div className="dashboard-stat-card">
            <History size={23} />
            <span>Recent Activity</span>
            <strong className="recent-activity-value">
              {historyLoading ? "..." : scans.length}
            </strong>
            <small>{latestActivity}</small>
          </div>
        </section>

        <section className="dashboard-section history-section" id="history">
          <div className="dashboard-section-heading">
            <div>
              <h2>Scan History</h2>
              <p>Review your previous URL scans and their results.</p>
            </div>

            <button
              type="button"
              className="history-refresh"
              onClick={() => loadHistory(pagination.page)}
              disabled={historyLoading}
            >
              <RefreshCw
                size={16}
                className={historyLoading ? "scanner-spinner" : ""}
              />
              Refresh
            </button>
          </div>

          {historyError && (
            <div className="scanner-error" role="alert">
              <AlertTriangle size={18} />
              {historyError}
            </div>
          )}

          {historyLoading ? (
            <div className="history-message">
              <LoaderCircle size={22} className="scanner-spinner" />
              Loading scan history...
            </div>
          ) : scans.length === 0 ? (
            <div className="history-message">
              <History size={30} />
              <p>No scans yet. Submit a URL to start building your history.</p>
            </div>
          ) : (
            <>
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Risk Score</th>
                      <th>Risk Level</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {scans.map((scan) => (
                      <tr key={scan._id}>
                        <td className="history-url">
                          {scan.normalizedUrl || scan.originalUrl}
                        </td>

                        <td>
                          {scan.riskScore !== null
                            ? `${scan.riskScore}/100`
                            : "N/A"}
                        </td>

                        <td>
                          {scan.riskLevel ? (
                            <span
                              className={`risk-badge ${getRiskClass(scan.riskLevel)}`}
                            >
                              {scan.riskLevel}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>

                        <td>{scan.status}</td>
                        <td>{formatDate(scan.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="history-pagination">
                <span>
                  Showing {scans.length} of {pagination.total} scans
                </span>

                <div>
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft size={17} />
                    Previous
                  </button>

                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>More Security Tools</h2>
              <p>Additional platform features.</p>
            </div>
          </div>

          <div className="dashboard-actions">
            <div className="dashboard-action-card">
              <History size={28} />
              <h3>Scan History</h3>
              <p>Review your previous scans and their results.</p>
              <span>Available above</span>
            </div>

            <div className="dashboard-action-card">
              <LockKeyhole size={28} />
              <h3>Security Awareness</h3>
              <p>Learn how to recognize phishing and online scams.</p>
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
