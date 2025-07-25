import { createClient } from "redis";
import BadRequest from "../errors/badRequest.js";
import { getOneUser } from "../controllers/user.js";
const redisClient = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});
redisClient.connect();
redisClient.on("error", (err) => console.error("Redis Client Error", err));
export const getMessages = (chatSp) => {
  return async (socket) => {
    const receiveId = socket.handshake.query.receiveId;
    const userId = socket.user.userId;
    const userMessages = await redisClient.lRange(`messages:${userId}`, 0, -1);
    if (receiveId) {
      const parsedUserMessages = userMessages
        .map((msg) => JSON.parse(msg))
        .filter((msg) => msg.senderId === receiveId)
        .map((msg) => {
          if (!msg.seen) msg.seen = true;
          return msg;
        });
      const receiverMessages = await redisClient.lRange(
        `messages:${receiveId}`,
        0,
        -1
      );
      const parsedReceiverMessages = receiverMessages
        .map((msg) => JSON.parse(msg))
        .filter((msg) => msg.senderId === userId)
        .map((msg) => {
          if (!msg.seen) msg.seen = true;
          return msg;
        });
      const allMessages = [
        ...parsedUserMessages,
        ...parsedReceiverMessages,
      ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      socket.emit("displayMessages", allMessages);
    } else {
      const parsedMessages = userMessages
        .map((msg) => JSON.parse(msg))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      // console.log(parsedMessages);
      socket.emit("displayMessages", parsedMessages);
    }
  };
};

export const chat = (chatNsp) => {
  return async (socket) => {
    console.log("Socket connected:", socket.user);
    const userId = socket.user.userId;
    socket.join(userId);
    const userMessages = await redisClient.lRange(`messages:${userId}`, 0, -1);
    const parsedMessages = userMessages
      .map((msg) => JSON.parse(msg))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const filteredMessages = parsedMessages.map((msg) => {
      if (msg.receiverId === userId && !msg.seen) {
        socket.emit("receiveMessage", {
          content: msg.content,
          senderId: userId,
        });
        msg.seen = true;
      }
      return msg;
    });
    await redisClient.del(`messages:${userId}`);
    filteredMessages.forEach(async (msg) => {
      await redisClient.rPush(`messages:${userId}`, JSON.stringify(msg));
    });
    socket.on("sendMessage", async (msgData) => {
      console.log("Sending message:", msgData);
      const { receiverId, content } = msgData;
      if (!receiverId) {
        throw new BadRequest("Receiver ID is required");
      }

      const isReceiverOnline = chatNsp.adapter.rooms.has(receiverId);

      const message = {
        receiverId,
        content,
        senderId: userId,
        seen: false,
        timestamp: new Date().toISOString(),
      };

      // ✅ If the receiver is online, send immediately
      if (isReceiverOnline) {
        message.seen = true;
        chatNsp.to(receiverId).emit("receiveMessage", {
          content,
          senderId: userId,
        });
      }

      // ✅ Always store in Redis (whether online or not)
      await redisClient.rPush(
        `messages:${receiverId}`,
        JSON.stringify(message)
      );
    });
  };
};
