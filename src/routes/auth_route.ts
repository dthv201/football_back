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
// router.put("/users/:id", authMiddleware, upload.single("profile_img"), updateUserInfo);
router.put("/users/:id", authMiddleware, upload.single("profile_img"), updateUserInfo);


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

export default router;