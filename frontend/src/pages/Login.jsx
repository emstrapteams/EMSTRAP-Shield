
import { useState } from "react";
import logo from "../assets/logo.png";
import { loginUser } from "../services/authService";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await loginUser(email.trim(), password);

      if (!response.success) {
        setError(response.message || "Login failed.");
        return;
      }

      const { token, user } = response.data;

      sessionStorage.setItem("shield_token", token);
      sessionStorage.setItem("shield_user", JSON.stringify(user));

      onLogin(user);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to connect to the server. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-content">
          <img src={logo} alt="EMSTRAP Shield Logo" className="brand-logo" />

          <h1>EMSTRAP Shield</h1>

          <p className="brand-tagline">
            Workplace Safety & Emergency Response
          </p>

          <div className="brand-divider" />

          <h2>Safety starts with preparedness.</h2>

          <p className="brand-description">
            A unified platform for workplace safety,
            emergency reporting, and response coordination.
          </p>

          <div className="brand-footer">
            EMSTRAP Shield · Workplace Safety Platform
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <img src={logo} alt="EMSTRAP Shield Logo" className="brand-logo" />
            <span>EMSTRAP Shield</span>
          </div>

          <div className="login-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>
              Enter your credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="login-note">
            Your account must be provisioned by your
            organization's administrator.
          </div>

          <p className="login-copyright">
            © {new Date().getFullYear()} EMSTRAP Shield
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;