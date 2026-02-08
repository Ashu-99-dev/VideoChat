import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import {
  generateOTP,
  sendVerificationEmail,
  validatePassword,
} from "../utils/email.utils.js";

export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists, please use a different one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; // generate a num between 1-100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    // Generate OTP
    const otp = generateOTP();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
      emailVerificationOTP: otp,
      emailVerificationExpires: verificationExpires,
      isEmailVerified: false,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, fullName, otp);
      console.log(`Verification OTP sent to ${email}`);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // If email fails to send, delete the user and return error
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ 
        message: "Failed to send verification email. Please try again." 
      });
    }

    res.status(201).json({ 
      success: true, 
      message: "Account created successfully! Please check your email for the verification code.",
      email: newUser.email
    });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
        emailNotVerified: true
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

    // Create stream user on first login (after email verification)
    try {
      await upsertStreamUser({
        id: user._id.toString(),
        name: user.fullName,
        image: user.profilePic || "",
      });
      console.log(`Stream user synced for ${user.fullName}`);
    } catch (error) {
      console.log("Error syncing Stream user:", error);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevent XSS attacks,
      sameSite: "strict", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user with matching email and OTP, check if OTP is not expired
    const user = await User.findOne({
      email,
      emailVerificationOTP: otp,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired OTP. Please request a new verification code." 
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      // Generate JWT token and log user in
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

      return res.status(200).json({ 
        success: true, 
        message: "Email is already verified. Logging you in...",
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic,
          isOnboarded: user.isOnboarded,
        }
      });
    }

    // Update user to mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationExpires = null;
    await user.save();

    console.log(`Email verified for user: ${user.email}`);

    // Create Stream user account
    try {
      await upsertStreamUser(user._id.toString(), user.fullName, user.profilePic);
      console.log(`Stream user created for: ${user.email}`);
    } catch (streamError) {
      console.error("Error creating Stream user:", streamError);
      // Don't fail verification if Stream creation fails
    }

    // Generate JWT token and log user in
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({ 
      success: true, 
      message: "Email verified successfully! Redirecting to onboarding...",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        isOnboarded: user.isOnboarded,
      }
    });
  } catch (error) {
    console.error("Error in verifyEmail controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found with this email address" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified. You can log in now." });
    }

    // Generate new OTP
    const otp = generateOTP();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send new verification email
    try {
      await sendVerificationEmail(email, user.fullName, otp);
      console.log(`Verification OTP resent to ${email}`);
    } catch (emailError) {
      console.error("Error resending verification email:", emailError);
      return res.status(500).json({ 
        message: "Failed to send verification email. Please try again later." 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Verification code sent! Please check your inbox." 
    });
  } catch (error) {
    console.error("Error in resendVerificationEmail controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}