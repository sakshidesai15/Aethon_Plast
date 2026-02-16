import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, tokenStore } from "../api/client";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("resetToken") || "";
  const resetEmailFromUrl = searchParams.get("email") || "";
  const isResetMode = Boolean(resetToken);

  const [authMode, setAuthMode] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [forgotEmail, setForgotEmail] = useState(resetEmailFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [showForgotForm, setShowForgotForm] = useState(false);

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmitReset = useMemo(
    () => Boolean(resetEmailFromUrl || forgotEmail) && Boolean(newPassword),
    [forgotEmail, newPassword, resetEmailFromUrl]
  );

  useEffect(() => {
    if (tokenStore.get()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const clearMessages = () => {
    setError("");
    setStatus("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await api.login(loginEmail, loginPassword);
      tokenStore.set(response.token);
      navigate("/", { replace: true });
    } catch (requestError) {
      if (requestError.payload?.verificationRequired) {
        setVerifyEmail(requestError.payload.email || loginEmail);
        setAuthMode("verify");
        const codeHint = requestError.payload.verificationCode
          ? ` Verification code: ${requestError.payload.verificationCode}`
          : "";
        setStatus((requestError.message || "Verification required.") + codeHint);
      } else {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await api.signup(signupName, signupEmail, signupPassword);
      setVerifyEmail(response.email || signupEmail);
      setAuthMode("verify");
      const codeHint = response.verificationCode ? ` Verification code: ${response.verificationCode}` : "";
      setStatus((response.message || "Verification code sent.") + codeHint);
      setSignupPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await api.verifyLogin(verifyEmail, verificationCode);
      tokenStore.set(response.token);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    clearMessages();
    try {
      const response = await api.resendVerification(verifyEmail);
      const codeHint = response.verificationCode ? ` Verification code: ${response.verificationCode}` : "";
      setStatus((response.message || "Verification code sent.") + codeHint);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await api.forgotPassword(forgotEmail);
      const baseMessage = response.message || "If this email exists, a reset link has been sent.";
      setStatus(response.resetLink ? `${baseMessage} ${response.resetLink}` : baseMessage);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const emailForReset = resetEmailFromUrl || forgotEmail;
      const response = await api.resetPassword(emailForReset, resetToken, newPassword);
      setStatus(response.message || "Password reset successful. Please login.");
      setNewPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={
          isResetMode
            ? handleResetPassword
            : authMode === "signup"
            ? handleSignup
            : authMode === "verify"
            ? handleVerify
            : handleLogin
        }
      >
        <h1>
          {isResetMode
            ? "Reset Password"
            : authMode === "signup"
            ? "Admin Sign Up"
            : authMode === "verify"
            ? "Verify Code"
            : "Admin Login"}
        </h1>
        <p>
          {isResetMode
            ? "Set a new password for your admin account."
            : "Use email and password to access the admin panel."}
        </p>

        {!isResetMode ? (
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <button type="button" onClick={() => { setAuthMode("login"); clearMessages(); }}>
              Login
            </button>
            <button type="button" onClick={() => { setAuthMode("signup"); clearMessages(); }}>
              Sign Up
            </button>
          </div>
        ) : null}

        {isResetMode ? (
          <>
            <input
              type="email"
              placeholder="Admin email"
              value={resetEmailFromUrl || forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              required
              disabled={Boolean(resetEmailFromUrl)}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </>
        ) : authMode === "signup" ? (
          <>
            <input
              type="text"
              placeholder="Full name"
              value={signupName}
              onChange={(event) => setSignupName(event.target.value)}
            />
            <input
              type="email"
              placeholder="Admin email"
              value={signupEmail}
              onChange={(event) => setSignupEmail(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New password"
              value={signupPassword}
              onChange={(event) => setSignupPassword(event.target.value)}
              required
            />
          </>
        ) : authMode === "verify" ? (
          <>
            <input
              type="email"
              placeholder="Admin email"
              value={verifyEmail}
              onChange={(event) => setVerifyEmail(event.target.value)}
              required
            />
            <input
              type="text"
              placeholder="6-digit verification code"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              required
            />
          </>
        ) : (
          <>
            <input
              type="email"
              placeholder="Admin email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
            />
          </>
        )}

        {error ? <div className="error">{error}</div> : null}
        {status ? <div className="status">{status}</div> : null}

        <button type="submit" disabled={loading || (isResetMode && !canSubmitReset)}>
          {loading
            ? "Please wait..."
            : isResetMode
            ? "Reset Password"
            : authMode === "signup"
            ? "Create Account"
            : authMode === "verify"
            ? "Verify and Login"
            : "Sign In"}
        </button>

        {!isResetMode && authMode === "verify" ? (
          <button type="button" onClick={handleResendCode} disabled={loading || !verifyEmail}>
            Resend Verification Code
          </button>
        ) : null}

        {!isResetMode && authMode === "login" ? (
          <>
            <button
              type="button"
              onClick={() => {
                setShowForgotForm((prev) => !prev);
                clearMessages();
              }}
            >
              {showForgotForm ? "Hide Forgot Password" : "Forgot Password?"}
            </button>
            {showForgotForm ? (
              <>
                <input
                  type="email"
                  placeholder="Enter admin email"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  required
                />
                <button type="button" onClick={handleForgotPassword} disabled={loading || !forgotEmail}>
                  Send Reset Link
                </button>
              </>
            ) : null}
          </>
        ) : null}
      </form>
    </div>
  );
};

export default LoginPage;
