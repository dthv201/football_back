import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import userModel, { IUser, SkillLevel } from '../models/users_model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';


const upload = multer();


export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // console.log("📥 Received Registration Request");
        // console.log("🔹 Request Body:", req.body);
        // console.log("🔹 Request File:", req.file);

        // console.log("Received Registration Request");
        // console.log("Body:", req.body);
        // console.log("File:", req.file);

     
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

        //  if (!req.file) {
        //     console.log("⚠️ No image uploaded, using default profile image.");
        // }

        const skillLevel_filed = skillLevel? skillLevel: SkillLevel.BEGINNER;
        const user = await userModel.create({
            username,
            skillLevel: skillLevel_filed,
            email,
            password: hashedPassword,
            profile_img: profileImageUrl
        });

       // console.log("✅ User registered successfully:", user);
        res.status(201).json({ message: 'User registered successfully', user });

    } catch (err) {
      
        res.status(400).json({ error: 'Registration failed', details: err });
        next(err);
    }
};


const login = async (req: Request, res: Response) => {
    try {
        // console.log("📥 Received Login Request");
        // console.log("🔹 Request Body:", req.body);

        const { email, password } = req.body;

        if (!email || !password) {
          //  console.log("❌ Missing email or password - Sending 400");
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await userModel.findOne({ email });
       // console.log("🔎 Found User in DB:", user);

        if (!user) {
           // console.log("❌ User Not Found - Sending 400");
            res.status(400).json({ error: 'Invalid credentials' });
            return;
        }

        // console.log("🔑 Checking Password Match:");
        // console.log("🔹 Entered Password:", password);
        // console.log("🔹 Hashed Password in DB:", user.password);

        const isPasswordValid = await bcrypt.compare(password, user.password);
       // console.log("Password Match:", isPasswordValid);
        if (!isPasswordValid) {
           // console.log("❌ Incorrect Password - Sending 400");
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
          //  console.log("Generated Tokens:", tokens.accessToken, tokens.refreshToken);
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
          //  console.log("❌ Logout: No refresh token provided");
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

       // console.log("🔍 Logout: Verifying refresh token:", refreshToken);
        const user = await verifyRefreshToken(refreshToken);

        // Remove the provided refresh token from the user's refreshToken array
       // console.log("🔄 Logout: Removing refresh token from user record.");
        user.refreshToken = (user.refreshToken || []).filter(token => token !== refreshToken);
        
        await user.save();
      //  console.log("✅ Logout: Refresh token removed and user saved successfully.");

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
       // console.log("❌ No refresh token provided in request body");
        res.status(400).json({ error: 'Refresh token is required' });
        //console.log("ℹ️ Response sent for missing refresh token");
        return;
      }
  
      //console.log("🔍 Starting refresh process for token:", refreshToken);
  
      let payload;
      try {
        payload = jwt.verify(refreshToken, process.env.TOKEN_SECRET as string) as any;
      //  console.log("✅ Token verified. Payload:", payload);
      } catch (err) {
       // console.log("❌ Token verification failed:", err);
        res.status(403).json({ error: 'Invalid refresh token' });
       // console.log("ℹ️ Response sent for invalid refresh token (verification failed)");
        return;
      }
  
      const userId = payload._id;
  
      // Atomically remove the used refresh token
      const user = await userModel.findOneAndUpdate(
        { _id: userId, refreshToken: refreshToken },
        { $pull: { refreshToken: refreshToken } },
        { new: true }
      );
  
      if (!user) {
        //console.log("❌ No user found with the provided refresh token, or token already used.");
        res.status(403).json({ error: 'Invalid refresh token' });
       // console.log("ℹ️ Response sent for invalid refresh token (user not found)");
        return;
      }
  
     // console.log("🔄 Refresh token removed from user's token list successfully.");
  
      // Generate new tokens
      const tokens = generateToken(user._id);
      if (!tokens) {
    //    console.log("❌ Failed to generate new tokens.");
        res.status(500).json({ error: 'Token generation failed' });
      //  console.log("ℹ️ Response sent for token generation failure");
        return;
      }
  //    console.log("🔑 New tokens generated:", tokens);
  
      // Add the new refresh token to the user's token array
      if (!user.refreshToken) {
        user.refreshToken = [];
      }
      user.refreshToken.push(tokens.refreshToken);
  
      await user.save();
      //console.log("✅ New refresh token added to user record.");
  
      res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id
      });
     // console.log("ℹ️ Response sent for successful token refresh.");
    } catch (err) {
     // console.log("❌ Error in refresh token process:", err);
      res.status(500).json({ error: 'Refresh failed', details: err instanceof Error ? err.message : "Unknown error" });
     // console.log("ℹ️ Response sent for refresh process error.");
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
     //   console.log("🔍 Verifying Refresh Token:", refreshToken);

        if (!refreshToken) {
            console.log("❌ No refresh token provided");
            reject("Refresh token missing");
            return;
        }

        if (!process.env.TOKEN_SECRET) {
         //   console.log("❌ TOKEN_SECRET is not defined");
            reject("Server configuration error: TOKEN_SECRET missing");
            return;
        }

        try {
            // Verify token
            const payload = jwt.verify(refreshToken, process.env.TOKEN_SECRET as string) as any;
            const userId = payload._id;
         //   console.log("✅ Refresh Token belongs to user:", userId);

            const user = await userModel.findById(userId);
            if (!user) {
            //    console.log("❌ No user found for this token");
                reject("Invalid token: user not found");
                return;
            }

            // Remove expired tokens
            user.refreshToken = (user.refreshToken || []).filter((token) => {
                try {
                    jwt.verify(token, process.env.TOKEN_SECRET as string);
                    return true; // Keep valid tokens
                } catch (error) {
                    return false; // Remove invalid/expired tokens
                }
            });

            // Ensure the provided token exists in the valid list
            if (!user.refreshToken.includes(refreshToken)) {
                await user.save();
          //      console.log("❌ Provided token is not in the user's valid token list");
                reject("Invalid refresh token");
                return;
            }

         //   console.log("✅ Refresh token is valid for:", user.email);
            await user.save(); // Save updated token list
            resolve(user);
        } catch (err) {
         //   console.log("❌ Error verifying refresh token:", err);
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
   // console.log("🔑 Token Received:", token);

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
        //    console.log("❌ Authorization Failed:", err)
            res.status(401).send('Access Denied');
            return;
        }
        
        req.params.userId = (payload as Payload)._id;
    //    console.log("✅ Decoded Token:", req.params.userId);
        next();
    });
};

export default {
    login,
    refresh,
    logout
};