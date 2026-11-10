import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LuLockKeyhole, LuArrowLeft } from "react-icons/lu";

import AuthLayout from "../components/layout/AuthLayout";
import TextField from "../components/ui/TextField";
import PasswordChecklist from "../components/ui/PasswordChecklist";
import Button from "../components/ui/Button";
import useForm from "../hooks/useForm";
import { resetPassword, isResetVerified } from "../services/authService";
import { useLoader } from "../components/loader/LoaderProvider";
import { PASSWORD_MAX, isPasswordValid } from "../utils/validators";

const validate = ({ password, confirm }) => {
  const errors = {};
  if (!isPasswordValid(password))
    errors.password = "Password must include a capital letter, be 8–16 characters, and include a symbol";
  if (confirm !== password) errors.confirm = "Passwords do not match";
  return errors;
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const { showLoader } = useLoader();
  const email = useLocation().state?.email;
  const { values, errors, formError, shakeTick, submitting, onChange, handleSubmit } = useForm({
    password: "", confirm: "",
  });

  // دخل الصفحة من غير ما يعدّي على Forgot Password + كود التحقق
  if (!email || !isResetVerified(email)) return <Navigate to="/forgot-password" replace />;

  const onValid = async ({ password }) => {
    await resetPassword({ email, password });
    await showLoader({ onCovered: () => navigate("/login", { state: { passwordReset: true, email } }) });
  };

  return (
    <AuthLayout variant="center">
      <form className="form form--login" noValidate onSubmit={handleSubmit(validate, onValid)}>
        <header className="form__head form__head--center reveal" style={{ "--i": 0 }}>
          <h1 className="form__title">Reset Password</h1>
          <p className="form__subtitle">Create a new password for<br />{email}</p>
        </header>

        <div className="form__fields">
          <div className="reveal" style={{ "--i": 1 }}>
            <TextField icon={LuLockKeyhole} type="password" name="password" placeholder="New Password"
              autoComplete="new-password" maxLength={PASSWORD_MAX}
              value={values.password} onChange={onChange} error={errors.password} shakeTick={shakeTick} />
            <PasswordChecklist password={values.password} />
          </div>
          <div className="reveal" style={{ "--i": 2 }}>
            <TextField icon={LuLockKeyhole} type="password" name="confirm" placeholder="Confirm Password"
              autoComplete="new-password" maxLength={PASSWORD_MAX} hideOnPaste
              value={values.confirm} onChange={onChange} error={errors.confirm} shakeTick={shakeTick} />
          </div>
        </div>

        {formError && <p className="form__alert" role="alert">{formError}</p>}

        <div className="reveal" style={{ "--i": 3 }}>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Reset Password"}</Button>
        </div>

        <Link to="/login" className="form__back reveal" style={{ "--i": 4 }}>
          <LuArrowLeft /> Back to Login
        </Link>
      </form>
    </AuthLayout>
  );
}
