import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { upsertStreamUser } from "../lib/stream.js";






export async function signup(req, res) {
    const { email, password, fullName } = req.body;
    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email is not valid" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists, please login or Use a different email" });
        }

        const idx = Math.floor(Math.random() * 100) + 1;
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

        const newUser = await User.create({
            email,
            fullName,
            password,
            profilePicture: randomAvatar,
        });


        try {
            await upsertStreamUser({
                id: newUser._id.toString(),
                name: newUser.fullName,
                image: newUser.profilePicture || ""
            });
            console.log(`Stream user created for ${newUser.fullName}`);
        } catch (error) {
            console.log("Error in creating user", error);

        }

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, // prevent XSS attacks
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        })

        return res.status(201).
            json({ message: "User created successfully" });
    } catch (error) {
        console.log("Error in signup controller", error);
        return res.status(500).json({ message: "Something went wrong" });

    }
}
export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isPasswordCorrect = await user.matchPassword(password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid email or password" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, // prevent XSS attacks
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        })

        return res.status(201).
            json({ success: true, user });
    } catch (error) {
        console.log("Error in login controller", error.message);
        return res.status(500).json({ message: "Something went wrong" });
    }
}
export async function logout(req, res) {
    res.clearCookie("jwt");
    return res.status(200).json({ success: true, message: "User logged out successfully" });
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
        if(!updatedUser) return res.status(200).json({ success: true, user: updatedUser });

        // update stream user
    } catch (error) {
        console.log("Error in onboarding controller", error);
        return res.status(500).json({ message: "Something went wrong" });

    }
}