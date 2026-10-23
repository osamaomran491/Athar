import { Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import { getSession, logout } from "../services/authService";

export default function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;

  return (
    <AuthLayout variant="center">
      <div className="form">
        <header className="form__head form__head--center reveal" style={{ "--i": 0 }}>
          <h1 className="form__title">Welcome, {session.name}</h1>
          <p className="form__subtitle">You are signed in as {session.email}</p>
        </header>
        <div className="reveal" style={{ "--i": 1 }}>
          <Button type="button" onClick={() => { logout(); window.location.assign(`${import.meta.env.BASE_URL}login`); }}>
            Log out
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
