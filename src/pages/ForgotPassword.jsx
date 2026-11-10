import { Link, useNavigate } from "react-router-dom";
import { LuMail, LuArrowLeft } from "react-icons/lu";

import AuthLayout from "../components/layout/AuthLayout";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import useForm from "../hooks/useForm";
import { requestPasswordReset, sendResetOtp } from "../services/authService";
import { isEmailValid } from "../utils/validators";

const validate = ({ email }) => {
  const errors = {};
  if (!isEmailValid(email)) errors.email = "Enter a valid email (at least 4 characters before @)";
  return errors;
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { values, errors, formError, shakeTick, submitting, onChange, handleSubmit } = useForm({ email: "" });

  const onValid = async ({ email }) => {
    const user = await requestPasswordReset({ email }); // بترمي AuthError("email", ...) لو الإيميل مش موجود
    await sendResetOtp({ email: user.email });
    navigate("/verify-otp", { state: { email: user.email } });
  };

  return (
    <AuthLayout variant="center">
      <form className="form form--login" noValidate onSubmit={handleSubmit(validate, onValid)}>
        <header className="form__head form__head--center reveal" style={{ "--i": 0 }}>
          <h1 className="form__title">Forgot Password?</h1>
          <p className="form__subtitle">
            Enter your email and we’ll send you<br />a 4-digit code
          </p>
        </header>

        <div className="form__fields">
          <div className="reveal" style={{ "--i": 1 }}>
            <TextField icon={LuMail} type="email" name="email" placeholder="Email Address" autoComplete="email"
              value={values.email} onChange={onChange} error={errors.email} shakeTick={shakeTick} />
          </div>
        </div>

        {formError && <p className="form__alert" role="alert">{formError}</p>}

        <div className="reveal" style={{ "--i": 2 }}>
          <Button type="submit" disabled={submitting}>{submitting ? "Checking…" : "Send Code"}</Button>
        </div>

        <Link to="/login" className="form__back reveal" style={{ "--i": 3 }}>
          <LuArrowLeft /> Back to Login
        </Link>
      </form>
    </AuthLayout>
  );
}
