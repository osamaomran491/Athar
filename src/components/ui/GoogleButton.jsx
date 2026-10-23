import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import Button from "./Button";
import useGoogleAuth, { GOOGLE_CONFIGURED } from "../../hooks/useGoogleAuth";
import { useLoader } from "../loader/LoaderProvider";


export default function GoogleButton({ onError = () => {} }) {
  const navigate = useNavigate();
  const { showLoader } = useLoader();
  const startGoogle = useGoogleAuth({
    onSuccess: () => showLoader({ onCovered: () => navigate("/dashboard") }),
    onError: (err) => onError(err.message),
  });

  const handleClick = () => {
        if (!GOOGLE_CONFIGURED) return;
    startGoogle();
  };

  return (
    <Button type="button" variant="outline" onClick={handleClick}>
      <FcGoogle />
      Login with Google
    </Button>
  );
}
