import { useGoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../services/authService";

export const GOOGLE_CONFIGURED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

/** بيرجّع function تفتح نافذة Google. onSuccess(session) / onError(error) */
export default function useGoogleAuth({ onSuccess, onError }) {
  return useGoogleLogin({
    onSuccess: async (token) => {
      try {
        const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token.access_token}` } });
        if (!res.ok) throw new Error("Could not read your Google profile");
        const p = await res.json();
        onSuccess(await loginWithGoogle({ name: p.name, email: p.email, picture: p.picture }));
      } catch (err) {
        onError(err);
      }
    },
    onError: () => onError(new Error("Google sign-in was cancelled or failed")),
  });
}
