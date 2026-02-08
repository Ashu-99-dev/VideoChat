import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { ShipWheelIcon, CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const email = location.state?.email;
  const { authUser } = useAuthUser();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle"); // 'idle', 'verifying', 'success', 'error'
  const [message, setMessage] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Redirect authenticated users
  useEffect(() => {
    if (authUser) {
      navigate(authUser.isOnboarded ? "/" : "/onboarding", { replace: true });
    }
  }, [authUser, navigate]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email && !authUser) {
      navigate("/signup");
    }
  }, [email, authUser, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 6) {
        verifyOtp(fullOtp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(newOtp);

    // Focus last filled input or first empty
    const focusIndex = Math.min(pastedData.length, 5);
    document.getElementById(`otp-${focusIndex}`)?.focus();

    // Auto-verify if 6 digits pasted
    if (pastedData.length === 6) {
      verifyOtp(pastedData);
    }
  };

  const verifyOtp = async (otpCode) => {
    setStatus("verifying");
    setMessage("");

    try {
      const response = await axiosInstance.post("/auth/verify-email", {
        email,
        otp: otpCode,
      });

      setStatus("success");
      setMessage(response.data.message || "Email verified successfully!");

      // Redirect with full page reload to onboarding (cookie is now properly set)
      setTimeout(() => {
        window.location.href = "/onboarding";
      }, 2000);
    } catch (error) {
      setStatus("error");
      setMessage(
        error.response?.data?.message || 
        "Failed to verify OTP. Please try again."
      );
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length === 6) {
      verifyOtp(fullOtp);
    }
  };

  const handleResend = async () => {
    setResendDisabled(true);
    setCountdown(60); // 60 second cooldown
    setMessage("");

    try {
      const response = await axiosInstance.post("/auth/resend-verification", {
        email,
      });

      setStatus("idle");
      setMessage(response.data.message || "Verification code sent!");
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } catch (error) {
      setMessage(
        error.response?.data?.message || 
        "Failed to resend code. Please try again."
      );
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center p-4"
      data-theme="forest"
    >
      <div className="border border-primary/25 flex flex-col w-full max-w-md mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 flex flex-col items-center">
          {/* LOGO */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              VideoChat
            </span>
          </div>

          {/* STATUS CONTENT */}
          <div className="w-full text-center">
            {status === "success" ? (
              <div className="space-y-4">
                <CheckCircle className="size-16 text-success mx-auto" />
                <h2 className="text-2xl font-semibold text-success">
                  Email Verified!
                </h2>
                <p className="text-sm opacity-70">{message}</p>
                <p className="text-sm opacity-70">
                  Redirecting to onboarding...
                </p>
                <Link
                  to="/onboarding"
                  className="btn btn-primary btn-sm mt-4"
                >
                  Go to Onboarding
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Mail className="size-8 text-primary" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold">Verify Your Email</h2>
                    <p className="text-sm opacity-70 mt-2">
                      We've sent a 6-digit code to
                    </p>
                    <p className="text-primary font-semibold">{email}</p>
                  </div>

                  {/* OTP INPUT */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          className="input input-bordered w-12 h-14 text-center text-2xl font-bold"
                          disabled={status === "verifying"}
                        />
                      ))}
                    </div>

                    {/* ERROR/SUCCESS MESSAGE */}
                    {message && status !== "success" && (
                      <div className={`alert ${status === "error" ? "alert-error" : "alert-info"}`}>
                        <span className="text-sm">{message}</span>
                      </div>
                    )}

                    {/* VERIFY BUTTON */}
                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={otp.join("").length !== 6 || status === "verifying"}
                    >
                      {status === "verifying" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Email"
                      )}
                    </button>
                  </form>

                  {/* RESEND */}
                  <div className="text-sm space-y-2">
                    <p className="opacity-70">Didn't receive the code?</p>
                    <button
                      onClick={handleResend}
                      disabled={resendDisabled}
                      className="btn btn-ghost btn-sm"
                    >
                      {resendDisabled
                        ? `Resend in ${countdown}s`
                        : "Resend Code"}
                    </button>
                  </div>

                  {/* INFO BOX */}
                  <div className="bg-base-200 p-4 rounded-lg text-sm text-left mt-4">
                    <p className="font-semibold mb-2">💡 Tips:</p>
                    <ul className="space-y-1 opacity-70">
                      <li>• Code expires in 10 minutes</li>
                      <li>• Check your spam folder</li>
                      <li>• Make sure you entered the correct email</li>
                    </ul>
                  </div>

                  {/* BACK TO SIGNUP */}
                  <div className="mt-4">
                    <Link
                      to="/signup"
                      className="text-sm text-primary hover:underline"
                    >
                      ← Back to Sign Up
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
