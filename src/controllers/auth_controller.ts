import { NextFunction, Request, Response } from 'express';
import userModel, { IUser, SkillLevel } from '../models/users_model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';

const register = async (req: Request, res: Response) => {
    try {

        console.log("Received Registration Request");
        console.log("Body:", req.body);
        console.log("File:", req.file);
        
        const { username, email, password, skillLevel, profile_img } = req.body;
        const existEmail =  await userModel.findOne({ email });

        if (existEmail) {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }

        const existingUsername =  await userModel.findOne({ username });

        if (existingUsername) {
            res.status(400).json({ error: 'Username already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = await userModel.create({
            username: username,
            skillLevel: skillLevel|| SkillLevel.BEGINNER,
            email: email,
            password: hashedPassword,
            profile_img: profile_img|| "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"

        });

        res.status(201).json({ message: 'User registered successfully', user });
        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(400).json({ error: 'Registration failed', details: err });
    }
};


const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await userModel.findOne({ email });
        console.log("User found:", user);

        if (!user) {
            res.status(400).json({ error: 'Invalid credentials' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("Password Match:", isPasswordValid);
        if (!isPasswordValid) {
            res.status(400).json({ error: 'Invalid credentials' });
            return;
        }

        if (!process.env.TOKEN_SECRET) {
            res.status(500).json({ error: 'Server error: Token secret not configured' });
            return;
        }

        const tokens = generateToken(user._id);
        if (tokens) {
            
            if (!user.refreshToken) {
                user.refreshToken = [];
            }
            user.refreshToken.push(tokens.refreshToken);
           
            await user.save();
            console.log("Generated Tokens:", tokens.accessToken, tokens.refreshToken);
            res.status(200).json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    _id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    skillLevel: user.skillLevel,
                    profile_img: user.profile_img,
                },
            });
        }

    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: 'Login failed', details: err.message });
        } else {
            res.status(500).json({ error: 'Login failed', details: 'Unknown error occurred' });
        }
    }
};




const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        const user = await verifyRefreshToken(refreshToken);

        await user.save();
        res.status(200).json({ message: 'Logged out successfully' });
        
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: 'Logout failed', details: err.message });
        } else {
            res.status(500).json({ error: 'Logout failed', details: 'Unknown error occurred' });
        }
    }
};

const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        const user = await verifyRefreshToken(refreshToken);

        if(user) {
            const tokens = generateToken(user._id);
            if (tokens) {
                if (!user.refreshToken) {
                    user.refreshToken = [];
                }
                user.refreshToken.push(tokens.refreshToken);
                
                await user.save();
                
                res.status(200).json({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    _id: user._id
                });
            }
        }
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: 'Refresh failed', details: err.message });
        } else {
            res.status(500).json({ error: 'Refresh failed', details: 'Unknown error occurred' });
        }
    }
};



type tTokens = {
    accessToken: string,
    refreshToken: string
}

const generateToken = (userId: string): tTokens | null => {
    if (!process.env.TOKEN_SECRET) {
        return null;
    }
    
    const random = Math.random().toString();
    const accessToken = jwt.sign({
        _id: userId,
        random: random
    },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRES });

    const refreshToken = jwt.sign({
        _id: userId,
        random: random
    },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });
    return {
        accessToken: accessToken,
        refreshToken: refreshToken
    };
};



type tUser = Document<unknown, {}, IUser> & IUser & Required<{
    _id: string;
}> & {
    __v: number;
}
const verifyRefreshToken = (refreshToken: string | undefined) => {
    return new Promise<tUser>((resolve, reject) => {
        if (!refreshToken) {
            reject("fail");
            return;
        }

        if (!process.env.TOKEN_SECRET) {
            reject("fail");
            return;
        }
        jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: any, payload: any) => {
            if (err) {
                reject("fail");
                return;
            }

            const userId = payload._id;
            try {
                const user = await userModel.findById(userId);
                if (!user) {
                    reject("fail");
                    return;
                }
                if (!user.refreshToken || !user.refreshToken.includes(refreshToken)) {
                    user.refreshToken = [];
                    await user.save();
                    reject("fail");
                    return;
                }
                const tokens = user.refreshToken!.filter((token) => token !== refreshToken);
                user.refreshToken = tokens;

                resolve(user);
            } catch (err) {
                reject("fail");
                return;
            }
        });
    });
}


type Payload = {
    _id: string;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.header('authorization');
    const token = authorization && authorization.split(' ')[1];

    if (!token) {
        res.status(401).send('Access Denied');
        return;
    }
    if (!process.env.TOKEN_SECRET) {
        res.status(500).send('Server Error');
        return;
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
        if (err) {
            res.status(401).send('Access Denied');
            return;
        }
        req.params.userId = (payload as Payload)._id;
        next();
    });
};

export default {
    register,
    login,
    refresh,
    logout
};