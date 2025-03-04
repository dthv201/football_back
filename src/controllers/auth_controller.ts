import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import userModel, { IUser, SkillLevel } from '../models/users_model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';
import { GoogleAuth } from 'google-auth-library';
import {OAuth2Client} from 'google-auth-library';
import { use } from 'passport';


const upload = multer();



const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleSignin = async (req: Request, res: Response, next: NextFunction)=> {
    try {
        console.log(req.body);

        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: process.env.GOOGLE_CLIENT_ID,  
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: "Invalid Google token" });
        }

        const email = payload.email;
        let user = await userModel.findOne({ email });

        const dummyPassword = Math.random().toString(36).slice(-8);
        if (!user) {
            user = await userModel.create({
                email,
                password: dummyPassword, 
                username: payload.name,
                profile_img: payload.picture,
                skillLevel: SkillLevel.BEGINNER,
                refreshToken: [],
            });
        }

        const tokens: tTokens | null = generateToken(user._id);
        if (!tokens) {
            return res.status(500).json({ error: "Token generation failed" });
        }

        if (!user.refreshToken) {
            user.refreshToken = [];
        }
        if (tokens) {
            user.refreshToken.push(tokens.refreshToken);
        }
        await user.save();

        res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                _id: user._id.toString(),
                username: user.username,
                email: user.email,
                profile_img: user.profile_img,
            },
        });

    } catch (err: unknown) {
        next(err)
    }
};


//I want to login from the registrerion too
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, email, password, skillLevel } = req.body;

        if (!username || !email || !password) {
            res.status(400).json({ error: "Username, email, and password are required" });
            return;
        }


        const existEmail = await userModel.findOne({ email });



        if (existEmail) {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }

        const existingUsername = await userModel.findOne({ username });

        if (existingUsername) {
            res.status(400).json({ error: 'Username already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const profileImageUrl = req.file ?
         `/uploads/${req.file.filename}` : 
         "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

        const skillLevel_filed = skillLevel? skillLevel: SkillLevel.BEGINNER;
        const user = await userModel.create({
            username,
            skillLevel: skillLevel_filed,
            email,
            password: hashedPassword,
            profile_img: profileImageUrl
        });
        const tokens = generateToken(user._id);
        if (!tokens) {
          res.status(500).json({ error: 'Token generation failed' });
          return;
        }
    
        // Initialize refreshToken array if not present and save the new token
        if (!user.refreshToken) {
          user.refreshToken = [];
        }
        user.refreshToken.push(tokens.refreshToken);
        await user.save();
    
        // Return tokens and user details (auto login)
        res.status(201).json({
          message: 'User registered and logged in successfully',
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

    } catch (err) {
      
        res.status(400).json({ error: 'Registration failed', details: err });
        next(err);
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

        if (!user) {
            res.status(400).json({ error: 'Invalid credentials' });
            return;
        }



        const isPasswordValid = await bcrypt.compare(password, user.password);

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
        user.refreshToken = (user.refreshToken || []).filter(token => token !== refreshToken);     
        await user.save();
        res.status(200).json({ message: 'Logged out successfully' });

    } catch (err) {
      //  console.log("❌ Logout failed:", err);
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
  
  
      let payload;
      try {
        payload = jwt.verify(refreshToken, process.env.TOKEN_SECRET as string) as any;

      } catch (err) {

        res.status(403).json({ error: 'Invalid refresh token' });

        return;
      }
  
      const userId = payload._id;
  
      const user = await userModel.findOneAndUpdate(
        { _id: userId, refreshToken: refreshToken },
        { $pull: { refreshToken: refreshToken } },
        { new: true }
      );
  
      if (!user) {
        res.status(403).json({ error: 'Invalid refresh token' });
        return;
      }
  
      const tokens = generateToken(user._id);
      if (!tokens) {
        res.status(500).json({ error: 'Token generation failed' });
        return;
      }

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
    } catch (err) {
      res.status(500).json({ error: 'Refresh failed', details: err instanceof Error ? err.message : "Unknown error" });
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

    // Use longer expiration times in test environment
    const accessExpiration = process.env.NODE_ENV === "test" ? "30d" : process.env.TOKEN_EXPIRES;
    const refreshExpiration = process.env.NODE_ENV === "test" ? "60d" : process.env.REFRESH_TOKEN_EXPIRES;

    const random = Math.random().toString();
    
    const accessToken = jwt.sign(
        { _id: userId, random },
        process.env.TOKEN_SECRET,
        { expiresIn: accessExpiration }
    );

    const refreshToken = jwt.sign(
        { _id: userId, random },
        process.env.TOKEN_SECRET,
        { expiresIn: refreshExpiration }
    );

    return { accessToken, refreshToken };
};




type tUser = Document<unknown, {}, IUser> & IUser & Required<{
    _id: string;
}> & {
    __v: number;
}
const verifyRefreshToken = (refreshToken: string | undefined) => {
    return new Promise<tUser>(async (resolve, reject) => {

        if (!refreshToken) {
            reject("Refresh token missing");
            return;
        }

        if (!process.env.TOKEN_SECRET) {
            reject("Server configuration error: TOKEN_SECRET missing");
            return;
        }

        try {

            const payload = jwt.verify(refreshToken, process.env.TOKEN_SECRET as string) as any;
            const userId = payload._id;

            const user = await userModel.findById(userId);
            if (!user) {
                reject("Invalid token: user not found");
                return;
            }

            user.refreshToken = (user.refreshToken || []).filter((token) => {
                try {
                    jwt.verify(token, process.env.TOKEN_SECRET as string);
                    return true; 
                } catch (error) {
                    return false;
                }
            });

            if (!user.refreshToken.includes(refreshToken)) {
                await user.save();
                reject("Invalid refresh token");
                return;
            }

            await user.save(); 
            resolve(user);
        } catch (err) {
            reject("Invalid refresh token");
        }
    });
};






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
    googleSignin,
    login,
    refresh,
    logout,
    
};