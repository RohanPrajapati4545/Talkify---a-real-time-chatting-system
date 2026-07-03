const express = require("express");
const router = express.Router();

const upload = require("./../middlewares/upload");
const AuthMiddleware = require("./../middlewares/authMiddleware");

const GroupController = require("./../controllers/GroupController");
const {
  joinGroupByCode,
  regenerateInviteCode,
} = require("./../controllers/GroupController"); 
 




router.post(
  "/create-group",
  upload.single("groupImage"),
  AuthMiddleware,( GroupController.createGroup)
 
);

router.get(
  "/get-my-group",
  AuthMiddleware, 
  GroupController.getMyGroup
);

router.post(
  "/send-message",
  upload.single("media"),
  AuthMiddleware,   
  GroupController.sendMessage
);

router.get(
  "/messages/:groupId",
  AuthMiddleware,
  GroupController.getMessages
);
router.delete(
  "/delete-group/:groupId",
  AuthMiddleware,
  GroupController.deleteGroup
);



router.put(
  "/update-message/:id",
  AuthMiddleware,
  GroupController.updateMessage
);

router.delete(
  "/delete-message/:id",
  AuthMiddleware,
  GroupController.deleteMessage
);

router.put(
  "/update-group/:groupId",
    upload.single("groupImage"),
  AuthMiddleware,        

  GroupController.updateGroup
);



router.post("/join-group", AuthMiddleware, joinGroupByCode);
 

router.put("/regenerate-code/:groupId", AuthMiddleware, regenerateInviteCode);

router.delete("/clear-group-chat/:groupId", AuthMiddleware, GroupController.clearGroupChat);


module.exports = router;