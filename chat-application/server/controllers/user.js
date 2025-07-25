import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
export const getOneUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select("-password");
  if (!user) {
    throw new BadRequest("User not found");
  }
  res.status(StatusCodes.OK).json({ data: user, success: true });
};

export const currentUser = async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new BadRequest("User not authenticated");
  }
  res.status(StatusCodes.OK).json({ data: user, success: true });
};

export const updateUser = async (req, res) => {
  const { userId: id } = req.user;
  const user = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new BadRequest("User not found");
  }
  user.password = undefined;
  user.attachCookiesToResponse(res);
  res.status(StatusCodes.OK).json({ data: user, success: true });
};

export const addFriend = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new BadRequest("Phone number is required");
  }

  // ✅ 1. Get current logged-in user
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new BadRequest("User not found");
  }

  // ✅ 2. Find friend by phone number
  const friend = await User.findOne({ phone });
  if (!friend) {
    throw new BadRequest("Friend not found");
  }

  // ✅ 3. Prevent adding yourself
  if (String(friend._id) === String(user._id)) {
    throw new BadRequest("You cannot add yourself as a friend");
  }

  // ✅ 4. Check if already friends
  if (user.friendsList.includes(friend._id)) {
    throw new BadRequest("Already friends");
  }

  // ✅ 5. Add friend to user's friendsList
  user.friendsList.push(friend._id);
  await user.save();
  try {
    const updatedUser = await User.findById(user._id);
    const newToken = jwt.sign(
      {
        userId: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        friendsList: updatedUser.friendsList,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const oneDay = 24 * 60 * 60 * 1000;
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: oneDay,
      sameSite: "lax",
      signed: false,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Friend added successfully",
      data: {
        _id: friend._id,
        name: friend.name,
        number: friend.phone,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
export const deleteUser = async () => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new BadRequest("User not found");
  }
  res.status(StatusCodes.OK).json({ success: true, message: "User deleted" });
};
