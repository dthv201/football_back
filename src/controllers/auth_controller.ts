import { NextFunction, Request, Response } from "express";
import userModel, { IUser, SkillLevel } from "../models/users_model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";

// Register User
const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password, skillLevel, profile_img } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required" });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        const existingUsername = await userModel.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ error: "Username is already taken" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword,
            skillLevel: skillLevel || SkillLevel.BEGINNER, // Default to BEGINNER
            profile_img: profile_img || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // Default profile image
        });

        res.status(201).json({ message: "User registered successfully", user });
    } catch (err) {
        res.status(400).json({ error: "Registration failed", details: err });
    }
};

// Login User
const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        if (!process.env.TOKEN_SECRET) {
            return res.status(500).json({ error: "Server error: Token secret not configured" });
        }

        const tokens = generateToken((user as tUser & { _id: string })._id.toString());

        if (tokens) {
            user.refreshToken = user.refreshToken || [];
            if (user.refreshToken) {
                user.refreshToken = user.refreshToken || [];
                if (tokens) {
                    if (tokens) {
                        user.refreshToken.push(tokens.refreshToken);
                    }
                }
            } else {
                user.refreshToken = [tokens.refreshToken];
            }

            await user.save();

            res.status(200).json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    skillLevel: user.skillLevel,
                    profile_img: user.profile_img,
                },
            });
        }
    } catch (err) {
        res.status(500).json({ error: "Login failed", details: err instanceof Error ? err.message : "Unknown error occurred" });
    }
};

// Logout User
const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        const user = await verifyRefreshToken(refreshToken);
        if (user.refreshToken) {
            user.refreshToken = user.refreshToken.filter(token => token !== refreshToken);
        }
        await user.save();

        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ error: "Logout failed", details: err instanceof Error ? err.message : "Unknown error occurred" });
    }
};

// Refresh Token
const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        const user = await verifyRefreshToken(refreshToken);
        const tokens = generateToken((user as tUser & { _id: string })._id.toString());
        if (!user.refreshToken) {
            user.refreshToken = [];
        }
        if(!tokens)
        {
            return res.status(500).json({ error: "Server error: Token secret not configured" });
        }
        user.refreshToken.push(tokens.refreshToken);
        await user.save();

        res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            _id: user._id,
        });
    } catch (err) {
        res.status(500).json({ error: "Refresh failed", details: err instanceof Error ? err.message : "Unknown error occurred" });
    }
};

// Token Generation
type tTokens = {
    accessToken: string;
    refreshToken: string;
};

const generateToken = (userId: string): tTokens | null => {
    if (!process.env.TOKEN_SECRET) {
        return null;
    }

    const random = Math.random().toString();
    const accessToken = jwt.sign({ _id: userId, random }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_EXPIRES });
    const refreshToken = jwt.sign({ _id: userId, random }, process.env.TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });

    return { accessToken, refreshToken };
};

// Verify Refresh Token
type tUser = Document & IUser;

const verifyRefreshToken = (refreshToken: string): Promise<tUser> => {
    return new Promise<tUser>((resolve, reject) => {
        if (!refreshToken || !process.env.TOKEN_SECRET) {
            return reject("fail");
        }

        jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err, payload: any) => {
            if (err) {
                return reject("fail");
            }

            try {
                const user = await userModel.findById(payload._id);
                if (!user || !user.refreshToken.includes(refreshToken)) {
                    user.refreshToken = [];
                    await user.save();
                    return reject("fail");
                }

                user.refreshToken = user.refreshToken.filter(token => token !== refreshToken);
                await user.save();

                resolve(user);
            } catch (err) {
                reject("fail");
            }
        });
    });
};

// Authentication Middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.header("authorization");
    const token = authorization && authorization.split(" ")[1];

    if (!token || !process.env.TOKEN_SECRET) {
        return res.status(401).send("Access Denied");
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, payload: any) => {
        if (err) {
            return res.status(401).send("Access Denied");
        }
        req.params.userId = payload._id;
        next();
    });
};

// Export Controller Functions
export default { register, login, refresh, logout };
