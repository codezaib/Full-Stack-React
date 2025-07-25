import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const User = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 100,
  },
  email: {
    type: String,
    match: [/^[a-zA-Z0-9.+*-]+@gmail\.com$/, "Invalid email fromat"],
  },
  password: {
    type: String,
    required: [true, "please provide password"],
    minLength: 6,
  },
  phone: {
    type: String,
    required: true,
    match: [/^03\d{2}\s\d{7}$/, "Invalid phone"],
    unique: true,
  },
  friendsList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});
User.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

User.methods.createJWT = function () {
  return jwt.sign(
    {
      user_id: this._id,
      name: this.name,
      phone: this.phone,
      friendsList: this.friendsList,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};
User.methods.attachCookiesToResponse = function (res, token) {
  const oneDay = 1000 * 60 * 60 * 24;
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: oneDay,
    sameSite: "lax",
    signed: false,
  });
};
User.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
User.methods.verifyToken = function (token) {
  return jwt.verify(token, process.env.JWT_SECRET);
};
export default mongoose.model("user", User);
