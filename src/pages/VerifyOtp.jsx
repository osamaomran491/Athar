import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";

import AuthLayout from "../components/layout/AuthLayout";
import { sendResetOtp, verifyResetOtp, getDemoOtp, SHOW_DEMO_OTP } from "../services/authService";
import "../styles/otp.css";

const LENGTH = 4;
const RESEND_SECONDS = 30;
const CLOCK = 2 * Math.PI * 7; // محيط دايرة العدّاد الصغيرة

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const emptyCode = () => Array(LENGTH).fill("");
const formatTime = (s) => `0:${String(s).padStart(2, "0")}`;
const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  return `${name[0]}${"•".repeat(Math.min(Math.max(name.length - 1, 3), 6))}@${domain}`;
};

export default function VerifyOtp() {
  const navigate = useNavigate();
  const email = useLocation().state?.email;

  const [digits, setDigits] = useState(emptyCode);
  const [status, setStatus] = useState("idle"); // idle | verifying | success | error
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [demoCode, setDemoCode] = useState(() => getDemoOtp());

  const inputs = useRef([]);
  const continueBtn = useRef(null);
  const alive = useRef(true);
  const timers = useRef([]);
  const statusRef = useRef(status);
  statusRef.current = status;

  const later = (fn, ms) => {
    timers.current.push(setTimeout(() => alive.current && fn(), ms));
  };

  useEffect(() => {
    alive.current = true;
    inputs.current[0]?.focus();
    return () => {
      alive.current = false;
      timers.current.forEach(clearTimeout);
    };
  }, []);

  // عدّاد إعادة الإرسال
  useEffect(() => {
    if (seconds <= 0 || status === "success") return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, status]);

  // أول ما الأربع خانات يتملّوا يتحقق لوحده
  const code = digits.join("");
  useEffect(() => {
    if (code.length === LENGTH && status === "idle") run(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const run = async (value) => {
    setStatus("verifying");
    setError("");
    const [failure] = await Promise.all([
      verifyResetOtp({ email, code: value }).then(() => null, (e) => e),
      wait(1200), // عشان أنيميشن Verifying يبان
    ]);
    if (!alive.current) return;
    if (failure) {
      setStatus("error");
      setError(failure.message || "Something went wrong. Try again.");
      later(() => {
        if (statusRef.current !== "error") return;
        setDigits(emptyCode());
        inputs.current[0]?.focus();
      }, 1000);
    } else {
      setStatus("success");
      later(() => continueBtn.current?.focus(), 700);
    }
  };

  const fill = (start, raw) => {
    const chars = raw.replace(/\D/g, "").slice(0, LENGTH - start).split("");
    if (!chars[0]) return;
    setStatus("idle");
    setError("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, k) => (next[start + k] = c));
      return next;
    });
    inputs.current[Math.min(start + chars.length, LENGTH - 1)]?.focus();
  };

  const onChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, "");
    if (!v) return;
    if (v.length > 1 && !digits[i]) fill(i, v); // autofill من الـ SMS
    else fill(i, v.slice(-1));
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      setStatus((s) => (s === "error" ? "idle" : s));
      setError("");
      setDigits((prev) => {
        const next = [...prev];
        if (next[i]) next[i] = "";
        else if (i > 0) next[i - 1] = "";
        return next;
      });
      if (!digits[i] && i > 0) inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      e.preventDefault();
      inputs.current[i + 1]?.focus();
    }
  };

  const onFocus = (e) => e.target.select();

  const onPaste = (e) => {
    e.preventDefault();
    fill(0, e.clipboardData.getData("text"));
  };

  const resend = async () => {
    if (seconds > 0 || status === "verifying" || status === "success") return;
    const { code: fresh } = await sendResetOtp({ email });
    if (!alive.current) return;
    setDemoCode(fresh);
    setSeconds(RESEND_SECONDS);
    setDigits(emptyCode());
    setStatus("idle");
    setError("");
    inputs.current[0]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === "success") navigate("/reset-password", { state: { email } });
    else if (code.length === LENGTH && (status === "idle" || status === "error")) run(code);
  };

  if (!email) return <Navigate to="/forgot-password" replace />;

  const filled = digits.filter(Boolean).length;
  const progress = status === "verifying" || status === "success" ? 100 : (filled / LENGTH) * 100;
  const locked = status === "verifying" || status === "success";

  return (
    <AuthLayout variant="center">
      <form className="form form--login otp" data-status={status} noValidate onSubmit={handleSubmit}>
        <header className="form__head form__head--center reveal" style={{ "--i": 0 }}>
          <div className="otp__lock">
            <svg className="otp__ring" viewBox="0 0 100 100" aria-hidden="true">
              <circle className="otp__ring-track" cx="50" cy="50" r="47" />
              <g className="otp__ring-spin">
                <circle className="otp__ring-arc" cx="50" cy="50" r="47" />
              </g>
            </svg>
            <svg className="otp__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path className="otp__shackle" d="M8 11V8a4 4 0 0 1 8 0v3" />
              <rect x="5" y="11" width="14" height="10" rx="2.5" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>

          <div key={status === "success" ? "ok" : "ask"} className="otp__swap">
            {status === "success" ? (
              <>
                <h1 className="form__title">You’re verified</h1>
                <p className="form__subtitle">Your code has been confirmed.<br />You can now set a new password</p>
              </>
            ) : (
              <>
                <h1 className="form__title">Verify it’s you</h1>
                <p className="form__subtitle">
                  Enter the 4-digit code we just sent to
                  <strong className="otp__email">{maskEmail(email)}</strong>
                </p>
              </>
            )}
          </div>
        </header>

        <div className="otp__boxes reveal" style={{ "--i": 1 }} onPaste={onPaste}>
          {digits.map((d, i) => (
            <div key={i} className={`otp__cell${d ? " is-filled" : ""}`} style={{ "--k": i }}>
              <input
                ref={(el) => (inputs.current[i] = el)}
                className="otp__input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1} of ${LENGTH}`}
                value={d}
                disabled={locked}
                onChange={(e) => onChange(i, e)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={onFocus}
              />
            </div>
          ))}
        </div>

        {status === "error" && error && (
          <p className="otp__error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" />
            </svg>
            {error}
          </p>
        )}

        <div className="reveal" style={{ "--i": 2 }}>
          <button ref={continueBtn} type="submit" className="btn btn--gold otp__btn"
            disabled={status === "verifying" || (status !== "success" && filled < LENGTH)}>
            <span className="otp__fill" style={{ width: `${progress}%` }} />
            <span className="otp__btn-label">
              {status === "verifying" && <><i className="otp__spinner" /> Verifying</>}
              {status === "success" && <>Continue <LuArrowRight /></>}
              {(status === "idle" || status === "error") && "Verify code"}
            </span>
          </button>
        </div>

        {status !== "success" && (
          <div className="otp__resend reveal" style={{ "--i": 3 }}>
            <span>Didn’t get a code?</span>
            {seconds > 0 ? (
              <span className="otp__timer">
                <svg className="otp__clock" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="7" className="otp__clock-track" />
                  <circle cx="10" cy="10" r="7" className="otp__clock-arc"
                    style={{ strokeDasharray: CLOCK, strokeDashoffset: CLOCK * (1 - seconds / RESEND_SECONDS) }} />
                </svg>
                Resend in {formatTime(seconds)}
              </span>
            ) : (
              <button type="button" className="otp__resend-btn" onClick={resend}>Resend code</button>
            )}
          </div>
        )}

        {SHOW_DEMO_OTP && status !== "success" && demoCode && (
          <p className="otp__demo">Your OTP is <b>{demoCode}</b></p>
        )}

        <Link to="/forgot-password" className="form__back otp__back reveal" style={{ "--i": 4 }}>
          <LuArrowLeft /> Change email
        </Link>
      </form>
    </AuthLayout>
  );
}
