import {
  updateUser,
  getOneUser,
  currentUser,
  deleteUser,
  addFriend,
} from "../controllers/user.js";
import { authentication } from "../middlewares/authentication.js";
import express from "express";
const router = express.Router();

router.get("/current", authentication, currentUser);
router.get("/:id", authentication, getOneUser);
router.patch("/update", authentication, updateUser);
router.delete("/:id", authentication, deleteUser);
router.post("/add/friend", authentication, addFriend);

export default router;
