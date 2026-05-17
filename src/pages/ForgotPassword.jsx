import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ──── CONSTANTS ────
const VALIDATION_ERRORS = {
  emailRequired: "Please enter your email address",
  emailTooLong: "Email must be less than 100 characters",
  emailInvalid: "Enter a valid email address",
  consecutiveDots: "Email cannot contain consecutive dots",
  invalidDomain: "Email domain is invalid",
  unsupportedDomain: "We only accept emails from: Gmail, Yahoo, Hotmail, Outlook, ProtonMail, iCloud, and other standard providers",
  passwordRequired: "Password is required",
  passwordTooShort: "Password must be at least 10 characters",
  needsUppercase: "Include at least one uppercase letter",
  needsLowercase: "Include at least one lowercase letter",
  needsNumber: "Include at least one number",
  needsSpecial: "Include at least one special character",
  passwordMismatch: "Passwords do not match",
  answerAllQuestions: "Please answer all security questions",
};

const MESSAGES = {
  successReset: "Password reset successfully!",
  connectError: "Unable to connect to the server",
  emailNotFound: "Email not found or no security questions set",
  failedReset: "Failed to reset password",
};

const validateEmail = (emailInput) => {
  if (!emailInput.trim()) return VALIDATION_ERRORS.emailRequired;
  const emailLower = emailInput.trim().toLowerCase();
  if (emailLower.length > 100) return VALIDATION_ERRORS.emailTooLong;
  
  // Basic email format validation
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(emailLower)) return VALIDATION_ERRORS.emailInvalid;
  
  // Check for consecutive dots
  if (/\.\./.test(emailLower)) return VALIDATION_ERRORS.consecutiveDots;
  
  // Extract domain
  const domain = emailLower.split("@")[1];
  if (!domain || domain.length > 50) return VALIDATION_ERRORS.invalidDomain;
  
  // List of allowed legitimate email domains
  const allowedDomains = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "protonmail.com",
    "icloud.com", "mail.com", "yandex.com", "zoho.com", "gmx.com", "aol.com",
    "tutanota.com", "mailbox.org", "fastmail.com", "posteo.de", "hey.com",
  ];
  
  // Check if domain is in allowed list
  if (!allowedDomains.includes(domain)) {
    return VALIDATION_ERRORS.unsupportedDomain;
  }
  
  // Check for common typos
  const commonTypos = {
    "gail.com": "gmail", "gmial.com": "gmail", "gamil.com": "gmail",
    "yaho.com": "yahoo", "hotnail.com": "hotmail", "outloo.com": "outlook",
    "yahooo.com": "yahoo", "amil.com": "gmail", "amail.com": "gmail",
  };
  
  if (commonTypos[domain]) {
    return `Did you mean ${commonTypos[domain]}.com? "${domain}" looks like a typo`;
  }
  
  return "";
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleStep1 = async (e) => {
    e.preventDefault();
    const emailValidationError = validateEmail(email);
    if (emailValidationError) { setError(emailValidationError); return; }
    setLoading(true); setError("");
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${backendUrl}/api/users/forgot-password/step1/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      const data = await response.json();
      if (response.ok && data.success) { setQuestions(data.questions); setAnswers({}); setStep(2); }
      else { setError(data.detail || data.message || MESSAGES.emailNotFound); }
    } catch { setError(MESSAGES.connectError); }
    finally { setLoading(false); }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!questions.every((q) => answers[q.id]?.trim())) { setError(VALIDATION_ERRORS.answerAllQuestions); return; }
    setStep(3); setError("");
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    if (!newPassword) { setError(VALIDATION_ERRORS.passwordRequired); return; }
    if (newPassword.length < 10) { setError(VALIDATION_ERRORS.passwordTooShort); return; }
    if (!/[A-Z]/.test(newPassword)) { setError(VALIDATION_ERRORS.needsUppercase); return; }
    if (!/[a-z]/.test(newPassword)) { setError(VALIDATION_ERRORS.needsLowercase); return; }
    if (!/[0-9]/.test(newPassword)) { setError(VALIDATION_ERRORS.needsNumber); return; }
    if (!/[!@#$%^&*()_+=\[\]{};':"\\|,.<>/?]/.test(newPassword)) { setError(VALIDATION_ERRORS.needsSpecial); return; }
    if (newPassword !== confirmPassword) { setError(VALIDATION_ERRORS.passwordMismatch); return; }
    const formattedAnswers = {};
    questions.forEach((q) => { formattedAnswers[q.id] = answers[q.id].trim().toLowerCase(); });
    setLoading(true); setError("");
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${backendUrl}/api/users/forgot-password/step2/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), answers: formattedAnswers, new_password: newPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(MESSAGES.successReset);
        setTimeout(() => navigate("/"), 2000);
      } else { setError(data.message || MESSAGES.failedReset); }
    } catch { setError(MESSAGES.connectError); }
    finally { setLoading(false); }
  };

  const pwStrength = (() => {
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const stepLabels = ["Identify", "Verify", "Secure"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0c0a09;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .fp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 15% 20%, rgba(202,163,74,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 50% 70% at 85% 80%, rgba(234,197,110,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .fp-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .fp-card {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        /* Brand */
        .fp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 40px;
        }
        .fp-logo {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #b8922a, #d4a94a);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Instrument Serif', serif;
          font-size: 20px; color: white;
          box-shadow: 0 0 24px rgba(212,169,74,0.4);
        }
        .fp-brand-name {
          font-family: 'Instrument Serif', serif;
          font-size: 18px;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.02em;
        }

        /* Heading */
        .fp-heading {
          margin-bottom: 8px;
        }
        .fp-heading h1 {
          font-family: 'Instrument Serif', serif;
          font-size: 38px;
          line-height: 1.1;
          color: #fff;
          font-weight: 400;
        }
        .fp-heading h1 em {
          font-style: italic;
          color: #d4a94a;
        }
        .fp-sub {
          color: rgba(255,255,255,0.35);
          font-size: 13px;
          font-weight: 300;
          margin-bottom: 32px;
          letter-spacing: 0.01em;
        }

        /* Steps */
        .fp-steps {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 36px;
        }
        .fp-step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .fp-step-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.2);
          transition: all 0.4s ease;
          flex-shrink: 0;
        }
        .fp-step-dot.active {
          border-color: #d4a94a;
          color: #d4a94a;
          background: rgba(212,169,74,0.1);
          box-shadow: 0 0 16px rgba(212,169,74,0.3);
        }
        .fp-step-dot.done {
          border-color: rgba(212,169,74,0.4);
          color: #b8922a;
          background: rgba(184,146,42,0.08);
        }
        .fp-step-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.15);
          transition: color 0.4s ease;
        }
        .fp-step-item.active .fp-step-label { color: rgba(255,255,255,0.5); }
        .fp-step-item.done .fp-step-label { color: rgba(184,146,42,0.5); }
        .fp-step-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 8px;
          position: relative;
          overflow: hidden;
        }
        .fp-step-line::after {
          content: '';
          position: absolute;
          left: 0; top: 0;
          height: 100%;
          background: linear-gradient(90deg, #b8922a, #d4a94a);
          transition: width 0.5s ease;
        }
        .fp-step-line.done::after { width: 100%; }
        .fp-step-line.empty::after { width: 0%; }

        /* Alerts */
        .fp-alert {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .fp-alert.error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .fp-alert.success {
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          color: #6ee7b7;
        }
        .fp-alert-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }

        /* Form */
        .fp-form { display: flex; flex-direction: column; gap: 18px; }

        .fp-field label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 8px;
        }
        .fp-input-wrap { position: relative; }
        .fp-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: rgba(255,255,255,0.85);
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .fp-input::placeholder { color: rgba(255,255,255,0.18); }
        .fp-input:focus {
          border-color: rgba(212,169,74,0.5);
          background: rgba(212,169,74,0.04);
          box-shadow: 0 0 0 3px rgba(212,169,74,0.08);
        }
        .fp-input.has-toggle { padding-right: 52px; }

        .fp-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .fp-toggle:hover { color: rgba(212,169,74,0.7); }

        /* Strength bar */
        .fp-strength {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }
        .fp-strength-bars { display: flex; gap: 4px; }
        .fp-strength-bar {
          width: 28px; height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s;
        }
        .fp-strength-bar.s1 { background: #ef4444; }
        .fp-strength-bar.s2 { background: #f59e0b; }
        .fp-strength-bar.s3 { background: #3b82f6; }
        .fp-strength-bar.s4 { background: #10b981; }
        .fp-strength-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .fp-strength-label.s1 { color: #ef4444; }
        .fp-strength-label.s2 { color: #f59e0b; }
        .fp-strength-label.s3 { color: #3b82f6; }
        .fp-strength-label.s4 { color: #10b981; }

        /* Buttons */
        .fp-actions { display: flex; gap: 10px; padding-top: 4px; }
        .fp-btn-primary {
          flex: 1;
          background: linear-gradient(135deg, #b8922a, #d4a94a);
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 20px rgba(212,169,74,0.25);
          letter-spacing: 0.01em;
        }
        .fp-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(212,169,74,0.35);
        }
        .fp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .fp-btn-secondary {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 14px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          letter-spacing: 0.01em;
        }
        .fp-btn-secondary:hover {
          border-color: rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.06);
        }

        .fp-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Back link */
        .fp-back {
          text-align: center;
          margin-top: 20px;
        }
        .fp-back a {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.2);
          text-decoration: none;
          letter-spacing: 0.03em;
          transition: color 0.2s;
        }
        .fp-back a:hover { color: rgba(212,169,74,0.7); }

        /* Success overlay */
        .fp-success-state {
          text-align: center;
          padding: 24px 0;
        }
        .fp-success-icon {
          width: 64px; height: 64px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          margin: 0 auto 20px;
          box-shadow: 0 0 32px rgba(16,185,129,0.15);
        }
        .fp-success-state h2 {
          font-family: 'Instrument Serif', serif;
          font-size: 26px;
          color: white;
          font-weight: 400;
          margin-bottom: 8px;
        }
        .fp-success-state p {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }
        .fp-redirect-bar {
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,0.06);
          border-radius: 1px;
          margin-top: 24px;
          overflow: hidden;
        }
        .fp-redirect-bar::after {
          content: '';
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
          animation: drain 2s linear forwards;
        }
        @keyframes drain { from { width: 100%; } to { width: 0%; } }

        /* Hint note */
        .fp-hint {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          font-weight: 300;
          line-height: 1.5;
          margin-bottom: 4px;
        }
      `}</style>

      <div className="fp-root">
        <div className="fp-grid" />

        <div className="fp-card">

          {/* Brand */}
          <div className="fp-brand">
            <div className="fp-logo">T</div>
            <span className="fp-brand-name">Taskr</span>
          </div>

          {success ? (
            /* ── Success State ── */
            <div className="fp-success-state">
              <div className="fp-success-icon">✓</div>
              <h2>All done!</h2>
              <p>Your password has been reset.<br />Redirecting you now…</p>
              <div className="fp-redirect-bar" />
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="fp-heading">
                <h1>Reset your <em>password</em></h1>
              </div>
              <p className="fp-sub">
                {step === 1 && "Start by confirming your account email."}
                {step === 2 && "Answer your security questions to verify it's you."}
                {step === 3 && "Choose a strong new password to secure your account."}
              </p>

              {/* Steps indicator */}
              <div className="fp-steps">
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  const isActive = step === n;
                  const isDone = step > n;
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div className={`fp-step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`} style={{ flex: 'unset' }}>
                        <div className={`fp-step-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                          {isDone ? '✓' : n}
                        </div>
                        <span className="fp-step-label">{label}</span>
                      </div>
                      {n < 3 && (
                        <div className={`fp-step-line ${isDone ? 'done' : 'empty'}`} style={{ flex: 1 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Error */}
              {error && (
                <div className="fp-alert error">
                  <span className="fp-alert-icon">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* ── Step 1 ── */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="fp-form">
                  <div className="fp-field">
                    <label>Email Address</label>
                    <input
                      className="fp-input"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com"
                      autoFocus
                    />
                  </div>
                  <div className="fp-actions">
                    <button type="submit" className="fp-btn-primary" disabled={loading}>
                      {loading ? <><div className="fp-spinner" /> Searching…</> : "Find My Account →"}
                    </button>
                  </div>
                  <div className="fp-back">
                    <button
                      onClick={() => navigate("/")}
                      className="text-[#C9A84C] hover:text-[#d4b76a] transition font-semibold flex items-center gap-1"
                    >
                      ← Back to login
                    </button>
                  </div>
                </form>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <form onSubmit={handleStep2} className="fp-form">
                  <p className="fp-hint">Answers are case-insensitive.</p>
                  {questions.map((q) => (
                    <div key={q.id} className="fp-field">
                      <label>{q.question}</label>
                      <input
                        className="fp-input"
                        type="text"
                        value={answers[q.id] || ""}
                        onChange={(e) => { setAnswers((a) => ({ ...a, [q.id]: e.target.value })); setError(""); }}
                        placeholder="Your answer…"
                      />
                    </div>
                  ))}
                  <div className="fp-actions">
                    <button type="button" className="fp-btn-secondary" onClick={() => { setStep(1); setError(""); }}>
                      ← Back
                    </button>
                    <button type="submit" className="fp-btn-primary" disabled={loading}>
                      Continue →
                    </button>
                  </div>
                </form>
              )}

              {/* ── Step 3 ── */}
              {step === 3 && (
                <form onSubmit={handleStep3} className="fp-form">
                  <div className="fp-field">
                    <label>New Password</label>
                    <div className="fp-input-wrap">
                      <input
                        className="fp-input has-toggle"
                        type={pwVisible ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                        placeholder="Min. 10 characters"
                        autoFocus
                      />
                      <button type="button" className="fp-toggle" onClick={() => setPwVisible(v => !v)}>
                        {pwVisible ? "Hide" : "Show"}
                      </button>
                    </div>
                    {newPassword.length > 0 && (
                      <div className="fp-strength">
                        <div className="fp-strength-bars">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`fp-strength-bar ${pwStrength >= i ? `s${pwStrength}` : ''}`}
                            />
                          ))}
                        </div>
                        <span className={`fp-strength-label ${pwStrength > 0 ? `s${pwStrength}` : ''}`}>
                          {["", "Weak", "Fair", "Good", "Strong"][pwStrength]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="fp-field">
                    <label>Confirm Password</label>
                    <div className="fp-input-wrap">
                      <input
                        className="fp-input has-toggle"
                        type={confirmVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                        placeholder="Repeat password"
                      />
                      <button type="button" className="fp-toggle" onClick={() => setConfirmVisible(v => !v)}>
                        {confirmVisible ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="fp-actions">
                    <button type="button" className="fp-btn-secondary" onClick={() => { setStep(2); setError(""); }}>
                      ← Back
                    </button>
                    <button type="submit" className="fp-btn-primary" disabled={loading}>
                      {loading ? <><div className="fp-spinner" /> Resetting…</> : "Reset Password →"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}