import express from "express";
const router = express.Router();
import postsController from "../controllers/posts_controller";
import auth_controller, { authMiddleware } from "../controllers/auth_controller";

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API for managing posts
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter posts by owner
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 */
router.get("/", authMiddleware, postsController.getAll.bind(postsController));

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: A single post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       400:
 *         description: Bad request
 */
router.get("/:id", authMiddleware, postsController.getById.bind(postsController));

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  authMiddleware,
  postsController.create.bind(postsController) // <-- No multer upload here
);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       400:
 *         description: Bad request
 */
router.put("/:id", authMiddleware, postsController.update.bind(postsController));

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       204:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 *       400:
 *         description: Invalid ID format
 *       500:
 *         description: Failed to delete post due to server error
 */
router.delete("/:id", authMiddleware, postsController.deleteItem.bind(postsController));

/**
 * @swagger
 * /api/posts/add-participant:
 *   post:
 *     summary: Add a participant to a post
 *     description: Adds a user to the participants list of a post.
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - participantId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: "65f1c0e8b3a9c4f0cfa2d123"
 *               participantId:
 *                 type: string
 *                 example: "65f2b5e3a6d4e8f0cdb8a567"
 *     responses:
 *       200:
 *         description: Participant added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Participant added successfully"
 *                 post:
 *                   $ref: "#/components/schemas/Post"
 *       400:
 *         description: Missing or invalid parameters / Participant already added
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post("/add-participant", authMiddleware, postsController.addParticipant.bind(postsController));

/**
 * @swagger
 * /api/posts/remove-participant:
 *   post:
 *     summary: Remove a participant from a post
 *     description: Removes a user from the participants list of a post.
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - participantId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: "65f1c0e8b3a9c4f0cfa2d123"
 *               participantId:
 *                 type: string
 *                 example: "65f2b5e3a6d4e8f0cdb8a567"
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Participant removed successfully"
 *                 post:
 *                   $ref: "#/components/schemas/Post"
 *       400:
 *         description: Missing or invalid parameters / Participant not found
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post("/remove-participant", authMiddleware, postsController.removeParticipant.bind(postsController));

/**
 * @swagger
 * /api/posts/split-teams:
 *   post:
 *     summary: Split post participants into balanced teams
 *     description: Fetches participants from a post and splits them into two balanced teams.
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: "65f1c0e8b3a9c4f0cfa2d123"
 *     responses:
 *       200:
 *         description: Teams split successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Teams split successfully"
 *                 teams:
 *                   type: object
 *                   properties:
 *                     teamA:
 *                       type: array
 *                       items:
 *                         type: object
 *                       example: [{ "_id": "65f2b5e3a6d4e8f0cdb8a567", "name": "Player 1" }]
 *                     teamB:
 *                       type: array
 *                       items:
 *                         type: object
 *                       example: [{ "_id": "65f3c9e1b7e8c5d4cfa1a789", "name": "Player 2" }]
 *       400:
 *         description: Not enough participants or missing postId
 *       404:
 *         description: Post or participants not found
 *       500:
 *         description: Internal server error
 */
router.post("/split-teams", authMiddleware, postsController.splitParticipantsIntoTeams.bind(postsController));

/**
 * @swagger
 * /posts/like:
 *   post:
 *     summary: like and unlike post by userId
 *     description: like and unlike single post by userId
 *     tags: [Posts]
 *     security:
 *       - bearerUser: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 *       400:
 *         description: Bad request (invalid data)
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post('/like', authMiddleware, postsController.handleLike.bind(postsController));

export default router;
