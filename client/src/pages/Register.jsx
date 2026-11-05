import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Mail,
  LockKeyhole,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Password cannot exceed 72 bytes.");
      return;
    }

    try {
      setLoading(true);

      await register({
        name,
        email,
        password,
      });

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login", {
          state: { registeredEmail: email },
        });
      }, 1200);
    } catch (err) {
      const message = err.response?.data?.message;

      const validationErrors = err.response?.data?.errors;

      if (validationErrors?.length) {
        setError(validationErrors[0].message);
      } else {
        setError(message || "Registration failed. Please try again.");
      }
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
              <User size={25} />
            </div>

            <span className="auth-eyebrow">
              CREATE YOUR ACCOUNT
            </span>

            <h2>Join PhishGuard.</h2>

            <p>
              Create your account and take a step toward
              safer digital experiences.
            </p>
          </div>

          {error && (
            <div className="auth-message auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-message auth-success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="name">Full name</label>

              <div className="auth-input-wrapper">
                <User size={18} />

                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email address</label>

              <div className="auth-input-wrapper">
                <Mail size={18} />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={254}
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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  autoComplete="new-password"
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

              <span className="auth-hint">
                Use at least 8 characters.
              </span>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Enter your password again"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>ALREADY HAVE AN ACCOUNT?</span>
          </div>

          <p className="auth-switch">
            <Link to="/login">Sign in to your account</Link>
          </p>

          <div className="auth-security-note">
            <LockKeyhole size={15} />
            Your account credentials are protected.
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

export default Register;
