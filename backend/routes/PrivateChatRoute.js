const express = require("express");
const router = express.Router();

const AuthMiddleware = require("../middlewares/authMiddleware");

const PrivateChatController = require("./../controllers/PrivateChatController");
const upload=require("./../middlewares/upload")


router.post(
  "/open-chat",
  AuthMiddleware,
  PrivateChatController.openPrivateChat
);


router.post(
  "/send-private-message",
  AuthMiddleware,
  upload.single("media"),
  PrivateChatController.sendPrivateMessage
);

router.get(
  "/private-messages/:chatId",
  AuthMiddleware,
  PrivateChatController.getPrivateMessages
);

router.delete(
"/delete-message/:id",
AuthMiddleware,
PrivateChatController.deleteMessage
);

router.put(
"/update-message/:id",
AuthMiddleware,
PrivateChatController.updateMessage
);
router.delete(
  "/delete-chat/:chatId",
  AuthMiddleware,
PrivateChatController.deleteChat);



router.get("/my-chats", AuthMiddleware, PrivateChatController.getMyChats);
module.exports = router;