import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuMail, LuLockKeyhole } from "react-icons/lu";

import AuthLayout from "../components/layout/AuthLayout";
import TextField from "../components/ui/TextField";
import Checkbox from "../components/ui/Checkbox";
import Button from "../components/ui/Button";
import Divider from "../components/ui/Divider";
import GoogleButton from "../components/ui/GoogleButton";
import useForm from "../hooks/useForm";
import { loginUser } from "../services/authService";
import { useLoader } from "../components/loader/LoaderProvider";
import { isEmailValid } from "../utils/validators";

const validate = ({ email, password }) => {
  const errors = {};
  if (!isEmailValid(email)) errors.email = "Enter a valid email (at least 4 characters before @)";
  if (!password) errors.password = "Enter your password";
  return errors;
};

export default function Login() {
  const navigate = useNavigate();
  const { showLoader } = useLoader();
  const location = useLocation();
  const justRegistered = location.state?.registered;
  const [googleError, setGoogleError] = useState("");

  const { values, errors, formError, shakeTick, submitting, onChange, handleSubmit } = useForm({
    email: location.state?.email || "", password: "", remember: false,
  });

  const onValid = async (data) => {
    await loginUser(data); // لو الباسورد غلط بترمي AuthError("password", ...)
    await showLoader({ onCovered: () => navigate("/dashboard") }); // شاشة اللوجو ثم الصفحة
  };

  return (
    <AuthLayout variant="center">
      <form className="form form--login" noValidate onSubmit={handleSubmit(validate, onValid)}>
        <header className="form__head form__head--center reveal" style={{ "--i": 0 }}>
          <h1 className="form__title">Museum Management System</h1>
          <p className="form__subtitle">Your heritage Our technology</p>
        </header>

        <div className="form__fields">
          <div className="reveal" style={{ "--i": 1 }}>
            <TextField icon={LuMail} type="email" name="email" placeholder="Email Address" autoComplete="email"
              value={values.email} onChange={onChange} error={errors.email} shakeTick={shakeTick} />
          </div>
          <div className="reveal" style={{ "--i": 2 }}>
            <TextField icon={LuLockKeyhole} type="password" name="password" placeholder="Password"
              autoComplete="current-password"
              value={values.password} onChange={onChange} error={errors.password} shakeTick={shakeTick} />
          </div>
        </div>

        <div className="form__options reveal" style={{ "--i": 3 }}>
          <Checkbox name="remember" checked={values.remember} onChange={onChange}>Remember me</Checkbox>
          {/* TODO: اربطها بصفحة استرجاع الباسورد */}
          <a href="#" className="form__forgot" onClick={(e) => e.preventDefault()}>Forget password?</a>
        </div>

        {justRegistered && !formError && (
          <p className="form__notice" role="status">Account created. Log in to continue.</p>
        )}
        {(formError || googleError) && <p className="form__alert" role="alert">{formError || googleError}</p>}

        <div className="reveal" style={{ "--i": 4 }}>
          <Button type="submit" disabled={submitting}>{submitting ? "Logging in…" : "Login"}</Button>
        </div>
        <div className="reveal" style={{ "--i": 5 }}><Divider /></div>
        <div className="reveal" style={{ "--i": 6 }}><GoogleButton onError={setGoogleError} /></div>

        <p className="form__switch reveal" style={{ "--i": 7 }}>
          Don’t have an account? <Link to="/register" reloadDocument>Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
