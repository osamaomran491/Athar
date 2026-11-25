import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import Button from "./Button";
import useGoogleAuth, { GOOGLE_CONFIGURED } from "../../hooks/useGoogleAuth";
import { USER_WEB_URL, getDefaultRoute, hasDashboardAccess, logout } from "../../services/authService";
import { useLoader } from "../loader/LoaderProvider";


export default function GoogleButton({ onError = () => {} }) {
  const navigate = useNavigate();
  const { showLoader } = useLoader();
  const startGoogle = useGoogleAuth({
    onSuccess: (session) => {
      if (!hasDashboardAccess(session)) {
        logout();
        showLoader({ onCovered: () => window.location.replace(USER_WEB_URL) });
        return;
      }
      showLoader({ onCovered: () => navigate(getDefaultRoute(session) || "/dashboard") });
    },
    onError: (err) => onError(err.message),
  });

  const handleClick = () => {
    if (!GOOGLE_CONFIGURED) {
      return onError("SOON");
    }
    startGoogle();
  };

  return (
    <Button type="button" variant="outline" onClick={handleClick}>
      <FcGoogle />
      Login with Google
    </Button>
  );
}
