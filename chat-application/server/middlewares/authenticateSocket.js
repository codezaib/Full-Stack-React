import cookie from "cookie";
import jwt from "jsonwebtoken";
export const authenticationSocket = (socket, next) => {
  const cookies = cookie.parse(socket.handshake.headers.cookie || "");
  const token = cookies.token || cookies["token.signed"];
  if (!token) {
    return next(new Error("Authentication invalid"));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = {
      userId: payload.user_id,
      name: payload.name,
      phone: payload.phone,
      friendsList: payload.friendsList,
    };
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return next(new Error("Authentication invalid"));
  }
};
