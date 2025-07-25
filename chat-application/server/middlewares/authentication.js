import UnAuthenticatedError from "../errors/unauthenticated.js";
import jwt from "jsonwebtoken";
export const authentication = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    throw new UnAuthenticatedError("Authentication invalid");
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: payload.user_id,
      name: payload.name,
      phone: payload.phone,
      friendsList: payload.friendsList,
    };
    next();
  } catch (error) {
    console.log(error);
    throw new UnAuthenticatedError("Authentication invalid");
  }
};
