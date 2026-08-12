/**
 * @module components/auth/GoogleOAuthButton
 *
 * The §48.5 shared OAuth entry: "Continue with Google" — Google "G"
 * start adornment, outline variant, full-width, used by both auth
 * pages. On click it runs the §28.6 Google OAuth flow — currently
 * the OQ-004 stub (`GET /auth/google` → 404 "Google sign-in is not
 * available in this version") — with the MUI loading spinner until
 * the call resolves or fails; failure surfaces as a §60 toast with
 * the §27 message (§48.3/§48.5). The "G" glyph is an inline SVG —
 * no icon package beyond §13.4.
 */
import MuiButton from "../reusable/MuiButton";
import { useGoogleAuthMutation } from "../../redux/features/authEndpoints";
import { showToast } from "../../utils/toast.jsx";

const GoogleGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
    />
  </svg>
);

export default function GoogleOAuthButton() {
  const [googleAuth, { isLoading }] = useGoogleAuthMutation();

  const handleClick = async () => {
    try {
      await googleAuth().unwrap();
    } catch (error) {
      showToast("error", error.message);
    }
  };

  return (
    <MuiButton
      variant="outlined"
      fullWidth
      loading={isLoading}
      onClick={handleClick}
      startIcon={<GoogleGlyph />}
    >
      Continue with Google
    </MuiButton>
  );
}