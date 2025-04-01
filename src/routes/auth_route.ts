import express from "express";
import multer from "multer";
import authController from "../controllers/auth_controller";
import { register,updateUserInfo, authMiddleware } from "../controllers/auth_controller";



const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
        const uploadPath = process.env.NODE_ENV === "test" ? "uploads/test" : "uploads";
        cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    cb(null, `${Date.now()}.${ext}`); 
  }
});
const upload = multer({ storage: storage });




/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API for authentication and authorization
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the user.
 *         username:
 *           type: string
 *           description: The user's username.
 *         email:
 *           type: string
 *           description: The user's email address.
 *         password:
 *           type: string
 *           description: The user's password.
 *         skillLevel:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced]
 *           description: The user's skill level. Defaults to "Beginner" if not provided.
 *         refreshToken:
 *           type: array
 *           items:
 *             type: string
 *           description: An array of refresh tokens.
 *         profile_img:
 *           type: string
 *           description: URL to the user's profile image.
 *       required:
 *         - username
 *         - email
 *         - password
 *       example:
 *         _id: "615f1b2e12f1b1a1a1a1a1a1"
 *         username: "JohnDoe"
 *         email: "john.doe@example.com"
 *         password: "hashed_password_here"
 *         skillLevel: "Beginner"
 *         refreshToken: ["refresh_token1", "refresh_token2"]
 *         profile_img: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
 */




/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for the user
 *               email:
 *                 type: string
 *                 description: User's email address 
 *               password:
 *                 type: string
 *                 description: User's password
 *               skillLevel:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *                 description: User's skill level (optional, defaults to Beginner)
 *               profile_img:
 *                 type: string
 *                 format: binary
 *                 description: User's profile image
 *             required:
 *               - username
 *               - password
 *               - email
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request (validation error)
 */
router.post("/register", (req, res, next) => {
  upload.single("profile_img")(req, res, (err) => {
      if (err) {
          console.error("❌ Multer Error:", err);
      }
      next();
  });
}, register);
router.post("/google", async (req, res, next) => {
  try {
    await authController.googleSignin(req, res, next);
  } catch (err) {
    next(err);
  }
});







// router.post("/register", upload.single("profile_img"), register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post("/login", authController.login);


/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user's profile.
 *     description: Update the username and profile image of a user.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The new username.
 *                 example: newUsername
 *               profile_img:
 *                 type: string
 *                 description: The new profile image path.
 *                 example: /uploads/newProfileImg.jpg
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.put("/users/:id", authMiddleware, upload.single("profile_img"), updateUserInfo);


/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: Retrieve the currently authenticated user.
 *     description: >
 *       Returns the details of the user based on the provided JWT access token.
 *       The token must be included in the Authorization header as a Bearer token.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The user ID.
 *                 username:
 *                   type: string
 *                   description: The username.
 *                 email:
 *                   type: string
 *                   description: The user's email.
 *                 skillLevel:
 *                   type: string
 *                   description: The user's skill level.
 *                 profile_img:
 *                   type: string
 *                   description: URL to the user's profile image.
 *             example:
 *               _id: "615f1b2e12f1b1a1a1a1a1a1"
 *               username: "JohnDoe"
 *               email: "john.doe@example.com"
 *               skillLevel: "Beginner"
 *               profile_img: "/uploads/profile.jpg"
 *       401:
 *         description: Unauthorized. Access token is missing or invalid.
 *       500:
 *         description: Internal server error.
 */
router.get("/user", authMiddleware, authController.fetchUser);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh a user's token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       400:
 *         description: Invalid refresh token
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/getParticipants:
 *   post:
 *     summary: Retrieve a list of participants by their IDs
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["67d9e62bd9ced8c054fe6836", "67d9e62bd9ced8c054fe6837"]
 *     responses:
 *       200:
 *         description: A list of participants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   skillLevel:
 *                     type: string
 *                     enum: [Beginner, Intermediate, Advanced]
 *                   email:
 *                     type: string
 *                   profile_img:
 *                     type: string
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post("/getParticipants", authMiddleware, authController.getParticipants);

export default router;