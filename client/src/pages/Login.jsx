import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState(
    location.state?.registeredEmail || ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-glow" />

      <header className="auth-navbar">
        <Link to="/" className="auth-brand">
          <div className="auth-brand-icon">
            <ShieldCheck size={26} />
          </div>

          <div>
            <h1>
              RAMAH<span>-PHISHGUARD</span>
            </h1>
            <p>BY RAMAH TECHNOLOGIES</p>
          </div>
        </Link>

        <div className="auth-navbar-actions">
  <ThemeToggle />

  <Link to="/" className="auth-home-link">
    Back to home
  </Link>
</div>
      </header>

      <main className="auth-main">
        <section className="auth-card">
          <div className="auth-card-heading">
            <div className="auth-heading-icon">
              <ShieldCheck size={25} />
            </div>

            <span className="auth-eyebrow">
              SECURE ACCESS
            </span>

            <h2>Welcome back.</h2>

            <p>
              Sign in to access your RAMAH-PHISHGUARD
              account and security dashboard.
            </p>
          </div>

          {error && (
            <div className="auth-message auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email address</label>

              <div className="auth-input-wrapper">
                <Mail size={18} />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="auth-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>NEW TO PHISHGUARD?</span>
          </div>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">Create one</Link>
          </p>

          <div className="auth-security-note">
            <LockKeyhole size={15} />
            Secure access powered by RAMAH TECHNOLOGIES.
          </div>
        </section>
      </main>

      <footer className="auth-footer">
        © {new Date().getFullYear()} RAMAH TECHNOLOGIES.
        DETECT THREATS. PROTECT PEOPLE.
      </footer>
    </div>
  );
}

export default Login;
