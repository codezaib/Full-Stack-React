import { register, logout, login } from "../controllers/auth.js";
import express from "express";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
export default router;
