import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useContext } from "react";
import userContext from "../context/Usercontext";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { handleGoogleLogin } = useContext(userContext);
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      handleGoogleLogin(code);
    }
  }, [code, handleGoogleLogin]);

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-5 text-white">
      <p role="status">Completing your Google sign-in…</p>
    </main>
  );
}
