import express from "express";
import { jwtAuthorization } from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// User routes
router.post("/register", register);

export default router;
