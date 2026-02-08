import { useState } from "react";
import { ShipWheelIcon, Check, X, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";
import  useSignUp from "../hooks/useSignUp";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { isPending, error, signupMutation } = useSignUp();

  // Password validation checks
  const passwordChecks = {
    length: signupData.password.length >= 8,
    uppercase: /[A-Z]/.test(signupData.password),
    lowercase: /[a-z]/.test(signupData.password),
    number: /[0-9]/.test(signupData.password),
    special: /[@$!%*?&]/.test(signupData.password),
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = signupData.password === signupData.confirmPassword;

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!passwordsMatch) {
      return;
    }

    const { confirmPassword, ...dataToSend } = signupData;
    
    signupMutation(dataToSend, {
      onSuccess: (data) => {
        // Redirect to OTP verification page
        navigate("/verify-email", { state: { email: data.email } });
      },
    });
  };

  return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
      data-theme="forest"
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        {/* SIGNUP FORM - LEFT SIDE */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          {/* LOGO */}
          <div className="mb-4 flex items-center justify-start gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              VideoChat
            </span>
          </div>

          {/* ERROR MESSAGE IF ANY */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error?.response?.data?.message || error?.message || "An error occurred"}</span>
            </div>
          )}

          <div className="w-full">
            <form onSubmit={handleSignup}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Create an Account</h2>
                  <p className="text-sm opacity-70">
                    Join VideoChat and start your language learning adventure!
                  </p>
                </div>

                <div className="space-y-3">
                  {/* FULLNAME */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="input input-bordered w-full"
                      value={signupData.fullName}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* EMAIL */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="john@gmail.com"
                      className="input input-bordered w-full"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({ ...signupData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        className="input input-bordered w-full pr-10"
                        value={signupData.password}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    
                    {/* Password Requirements */}
                    {signupData.password && (
                      <div className="mt-2 p-3 bg-base-200 rounded-lg text-xs space-y-1">
                        <p className="font-semibold mb-2">Password must contain:</p>
                        <div className="space-y-1">
                          <PasswordCheck 
                            met={passwordChecks.length} 
                            text="At least 8 characters" 
                          />
                          <PasswordCheck 
                            met={passwordChecks.uppercase} 
                            text="One uppercase letter (A-Z)" 
                          />
                          <PasswordCheck 
                            met={passwordChecks.lowercase} 
                            text="One lowercase letter (a-z)" 
                          />
                          <PasswordCheck 
                            met={passwordChecks.number} 
                            text="One number (0-9)" 
                          />
                          <PasswordCheck 
                            met={passwordChecks.special} 
                            text="One special character (@$!%*?&)" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Confirm Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        className={`input input-bordered w-full pr-10 ${
                          signupData.confirmPassword && !passwordsMatch ? 'input-error' : ''
                        }`}
                        value={signupData.confirmPassword}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {signupData.confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-error mt-1">Passwords do not match</p>
                    )}
                    {signupData.confirmPassword && passwordsMatch && (
                      <p className="text-xs text-success mt-1 flex items-center gap-1">
                        <Check size={14} /> Passwords match
                      </p>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        required
                      />
                      <span className="text-xs leading-tight">
                        I agree to the{" "}
                        <span className="text-primary hover:underline">
                          terms of service
                        </span>{" "}
                        and{" "}
                        <span className="text-primary hover:underline">
                          privacy policy
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <button 
                  className="btn btn-primary w-full" 
                  type="submit"
                  disabled={
                    isPending || 
                    (signupData.password && !allChecksPassed) ||
                    (signupData.confirmPassword && !passwordsMatch)
                  }
                >
                  {isPending ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>

                <div className="text-center mt-4">
                  <p className="text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* SIGNUP FORM - RIGHT SIDE */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* Illustration */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img
                src="/i.png"
                alt="Language connection illustration"
                className="w-full h-full"
              />
            </div>

            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">
                Connect with language partners worldwide
              </h2>
              <p className="opacity-70">
                Practice conversations, make friends, and improve your language
                skills together
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Password check component
const PasswordCheck = ({ met, text }) => (
  <div className="flex items-center gap-2">
    {met ? (
      <Check className="size-4 text-success flex-shrink-0" />
    ) : (
      <X className="size-4 text-error flex-shrink-0" />
    )}
    <span className={met ? "text-success" : "opacity-60"}>{text}</span>
  </div>
);

export default SignUpPage;
