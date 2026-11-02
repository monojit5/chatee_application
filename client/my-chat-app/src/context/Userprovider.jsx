import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import userContext from "./Usercontext";
import api from "../api";
import { useNavigate } from "react-router-dom";

const initialEmail = sessionStorage.getItem("registrationEmail") || "";

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.message || fallback
);

const Userprovider = ({ children }) => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("authToken") || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(localStorage.getItem("authToken")));
  const [regData, setRegData] = useState({
    name: "",
    email: initialEmail,
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  useEffect(() => {
    let active = true;
    if (!authToken) {
      return undefined;
    }

    api.get("/user/me")
      .then(({ data }) => {
        if (active) setCurrentUser(data.user);
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          setAuthToken("");
          setCurrentUser(null);
        } else {
          toast.error(getErrorMessage(error, "Could not verify your session."));
        }
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authToken]);

  const handleRegistrationChange = (event) => {
    const { name, value, type, checked } = event.target;
    setRegData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegistrationSubmit = async (event) => {
    event.preventDefault();
    if (isRegistering) return;

    const name = regData.name.trim();
    const email = regData.email.trim().toLowerCase();
    const { password, confirmPassword } = regData;
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (name.length < 2 || name.length > 100) {
      toast.error("Name must be between 2 and 100 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 6 || password.length > 72) {
      toast.error("Password must be between 6 and 72 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Your passwords do not match.");
      return;
    }
    if (!regData.termsAccepted) {
      toast.error("Please agree to the Terms & Privacy Policy to continue.");
      return;
    }

    setIsRegistering(true);
    try {
      const { data } = await api.post("/user/register", { name, email, password });
      sessionStorage.setItem("registrationEmail", email);
      setRegData((currentData) => ({ ...currentData, email }));
      toast.success(data.message || "Verification code sent to your email.");
      navigate("/otp");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not connect to the server. Please try again."));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleOtpChange = (index, value, focusInput) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setOtp((currentOtp) => currentOtp.map((digit, position) => (
        position === index ? "" : digit
      )));
      return;
    }

    setOtp((currentOtp) => {
      const nextOtp = [...currentOtp];
      digits.slice(0, 6 - index).split("").forEach((digit, offset) => {
        nextOtp[index + offset] = digit;
      });
      return nextOtp;
    });
    focusInput?.(Math.min(index + digits.length, 5));
  };

  const handleOtpKeyDown = (event, index, focusInput) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      focusInput(index - 1);
    } else if (event.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (event.key === "ArrowRight" && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleOtpPaste = (event, focusInput) => {
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedDigits) return;
    event.preventDefault();
    setOtp([...pastedDigits, ...Array(6 - pastedDigits.length).fill("")]);
    focusInput(Math.min(pastedDigits.length, 5));
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    if (isVerifyingOtp) return;

    const email = regData.email.trim().toLowerCase();
    const code = otp.join("");
    if (!email) {
      toast.error("Register first to receive a verification code.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const { data } = await api.post("/user/otp-verify", { email, otp: code });
      toast.success(data.message || "Email verified successfully.");
      sessionStorage.removeItem("registrationEmail");
      setOtp(Array(6).fill(""));
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not verify the code. Please try again."));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpResend = async () => {
    if (isResendingOtp) return;
    const email = regData.email.trim().toLowerCase();
    if (!email) {
      toast.error("Register first to receive a verification code.");
      return;
    }

    setIsResendingOtp(true);
    try {
      const { data } = await api.post("/user/otp-resend", { email });
      toast.success(data.message || "A new verification code was sent.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not resend the code. Please try again."));
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (isLoggingIn) return;

    const email = loginData.email.trim().toLowerCase();
    const { password } = loginData;
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data } = await api.post("/user/login", { email, password });
      if (!data.token || !data.user) {
        toast.error(data.message || "Login could not be completed.");
        return;
      }

      localStorage.setItem("authToken", data.token);
      setCurrentUser(data.user);
      setAuthToken(data.token);
      toast.success(data.message || "Login successful.");
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not connect to the server. Please try again."));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = useCallback(async (code) => {
    try {
      const { data } = await api.post("/user/google/exchange", { code });
      if (!data.token || !data.user) {
        throw new Error("Google sign-in did not return a valid session.");
      }
      localStorage.setItem("authToken", data.token);
      setCurrentUser(data.user);
      setAuthToken(data.token);
      toast.success("Signed in with Google.");
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not complete Google sign-in."));
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const updateProfile = useCallback(async ({ name, about, avatar }) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("about", about);
    if (avatar) formData.append("avatar", avatar);
    const { data } = await api.patch("/user/profile", formData);
    setCurrentUser(data.user);
    return data.user;
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/user/logout");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not reach the server; signing out on this device."));
    } finally {
      localStorage.removeItem("authToken");
      setAuthToken("");
      setCurrentUser(null);
      navigate("/login");
    }
  };

  return (
    <userContext.Provider
      value={{
        regData,
        isRegistering,
        otp,
        isVerifyingOtp,
        isResendingOtp,
        loginData,
        isLoggingIn,
        authToken,
        currentUser,
        isAuthLoading,
        handleLogout,
        handleRegistrationChange,
        handleRegistrationSubmit,
        handleOtpChange,
        handleOtpKeyDown,
        handleOtpPaste,
        handleOtpSubmit,
        handleOtpResend,
        handleLoginChange,
        handleLoginSubmit,
        handleGoogleLogin,
        updateProfile,
      }}
    >
      {children}
    </userContext.Provider>
  );
};

export default Userprovider;
