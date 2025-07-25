import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import BadRequest from "../errors/badRequest.js";

export const register = async (req, res) => {
  try {
    const user = await User.create({ ...req.body });
    if (!user) {
      throw new BadRequest("User registration failed");
    }
    const token = user.createJWT();
    user.attachCookiesToResponse(res, token);
    user.password = undefined;
    res.status(StatusCodes.CREATED).json({ data: user, success: true });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    throw new BadRequest("Please provide phone and password");
  }
  const user = await User.findOne({ phone });
  if (!user) {
    throw new BadRequest("Invalid credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new BadRequest("Invalid credentials");
  }
  const token = user.createJWT();
  user.attachCookiesToResponse(res, token);
  user.password = undefined;
  res.status(StatusCodes.OK).json({ data: user, success: true });
};

export const logout = async () => {
  res.cookie("token", "logout", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    signed: true,
  });
  res
    .status(StatusCodes.OK)
    .json({ success: true, message: "User logged out" });
};
