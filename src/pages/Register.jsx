import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuUser, LuMail, LuLockKeyhole } from "react-icons/lu";

import AuthLayout from "../components/layout/AuthLayout";
import TextField from "../components/ui/TextField";
import PasswordChecklist from "../components/ui/PasswordChecklist";
import Button from "../components/ui/Button";
import Divider from "../components/ui/Divider";
import GoogleButton from "../components/ui/GoogleButton";
import useForm from "../hooks/useForm";
import { registerUser } from "../services/authService";
import { useLoader } from "../components/loader/LoaderProvider";
import { PASSWORD_MAX, isEmailValid, isPasswordValid } from "../utils/validators";

const validate = ({ name, email, password, confirm }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Enter your full name";
  if (!isEmailValid(email)) errors.email = "Enter a valid email address";
  if (!isPasswordValid(password))
    errors.password = "Password must start with a capital letter, be 8–16 characters, and include a symbol";
  if (confirm !== password) errors.confirm = "Passwords do not match";
  return errors;
};

export default function Register() {
  const navigate = useNavigate();
  const { showLoader } = useLoader();
  const [googleError, setGoogleError] = useState("");
  const { values, errors, formError, shakeTick, submitting, onChange, handleSubmit } = useForm({
    name: "", email: "", password: "", confirm: "",
  });

  const onValid = async (data) => {
    await registerUser(data); // ← استبدلها بـ API حقيقي لاحقًا
    await showLoader({ onCovered: () => navigate("/login", { state: { registered: true, email: data.email } }) });
  };

  return (
    <AuthLayout variant="left">
      <form className="form form--register" noValidate onSubmit={handleSubmit(validate, onValid)}>
        <header className="form__head reveal" style={{ "--i": 0 }}>
          <h1 className="form__title">Create Account</h1>
          <p className="form__subtitle">
            Join ATHER and start managing the museum<br />and your robot fleet
          </p>
        </header>

        <div className="form__fields">
          <div className="reveal" style={{ "--i": 1 }}>
            <TextField icon={LuUser} name="name" placeholder="Full Name" autoComplete="name"
              value={values.name} onChange={onChange} error={errors.name} shakeTick={shakeTick} />
          </div>
          <div className="reveal" style={{ "--i": 2 }}>
            <TextField icon={LuMail} type="email" name="email" placeholder="Email Address" autoComplete="email"
              value={values.email} onChange={onChange} error={errors.email} shakeTick={shakeTick} />
          </div>
          <div className="reveal" style={{ "--i": 3 }}>
            <TextField icon={LuLockKeyhole} type="password" name="password" placeholder="Password"
              autoComplete="new-password" maxLength={PASSWORD_MAX}
              value={values.password} onChange={onChange} error={errors.password} shakeTick={shakeTick} />
            <PasswordChecklist password={values.password} />
          </div>
          <div className="reveal" style={{ "--i": 4 }}>
            <TextField icon={LuLockKeyhole} type="password" name="confirm" placeholder="Confirm Password"
              autoComplete="new-password" maxLength={PASSWORD_MAX}
              value={values.confirm} onChange={onChange} error={errors.confirm} shakeTick={shakeTick} />
          </div>
        </div>

        {(formError || googleError) && <p className="form__alert" role="alert">{formError || googleError}</p>}

        <div className="reveal" style={{ "--i": 5 }}>
          <Button type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Sign Up"}</Button>
        </div>
        <div className="reveal" style={{ "--i": 6 }}><Divider /></div>
        <div className="reveal" style={{ "--i": 7 }}><GoogleButton onError={setGoogleError} /></div>

        <p className="form__switch reveal" style={{ "--i": 8 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
