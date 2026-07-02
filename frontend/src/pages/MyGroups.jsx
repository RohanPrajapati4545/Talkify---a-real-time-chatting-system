import React, { useEffect, useState,useMemo  } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import socket from "../socket/Socket";
import { useRef } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { logout } from "./../../../frontend/src/pages/redux/AuthSlice";
import SideBar from "./../components/SideBar";
import "./../App.css";

const MyGroups = () => {

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const privateMessagesRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [privateChat, setPrivateChat] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(null); // 👈 NAYA
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate()
  const messagesEndRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [groupLastActivity, setGroupLastActivity] = useState({});
const [userLastActivity, setUserLastActivity] = useState({});
  const { token, user } = useSelector(
    (state) => state.auth
  );
  const msgMenuRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMsgMenu, setShowMsgMenu] = useState(null);

  const [showForwardModal, setShowForwardModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [forwardTargets, setForwardTargets] = useState([]);
  const [forwarding, setForwarding] = useState(false);
  const [forwardSearch, setForwardSearch] = useState("");

  const [activeTab, setActiveTab] = useState("groups");

  const [media, setMedia] = useState(null);
  const menuRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [showAddUserModal, setShowAddUserModal] =
    useState(false);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  
  const [groupTypingUsers, setGroupTypingUsers] = useState({}); // { groupId: { userId: userName } }
  const [privateTypingStatus, setPrivateTypingStatus] = useState({}); // { otherUserId: userName }
  const typingTimeoutRef = useRef(null);
// 👇 NAYA — EDIT GROUP STATES
const [showEditGroupModal, setShowEditGroupModal] = useState(false);
const [editGroupName, setEditGroupName] = useState("");
const [editGroupImage, setEditGroupImage] = useState(null);
const [editGroupLoading, setEditGroupLoading] = useState(false);
  // selectedUser ka latest value ref me sync karo taaki socket listener (jo mount time pe register hota hai) stale na ho
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const getAllUsers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/users/all-users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Users API:", res.data);
      setAllUsers(res.data);
      const filteredUsers = res.data.filter(
        (u) => u._id !== user._id
      );

      setUsers(filteredUsers);

    } catch (error) {
      console.log(error);
    }
  };

  const getBlockedUsers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/users/blocked-users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBlockedUsers(res.data.map((u) => u._id));

    } catch (error) {
      console.log(error);
    }
  };

  const isUserBlocked = (id) => blockedUsers.includes(id);
  const isOnline = (id) => onlineUsers.includes(id);

  const toggleBlockUser = () => {
    if (!selectedUser) return;

    const blocked = isUserBlocked(selectedUser._id);

    Swal.fire({
      title: blocked ? "Unblock User?" : "Block User?",
      text: blocked
        ? "You will start receiving messages from this user again."
        : "You won't receive messages from this user anymore, and they won't be able to message you.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: blocked ? "Unblock" : "Block",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const url = blocked
          ? `http://localhost:5000/api/users/unblock/${selectedUser._id}`
          : `http://localhost:5000/api/users/block/${selectedUser._id}`;

        await axios.put(
          url,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setBlockedUsers((prev) =>
          blocked
            ? prev.filter((id) => id !== selectedUser._id)
            : [...prev, selectedUser._id]
        );

        toast.success(blocked ? "User unblocked" : "User blocked");

      } catch (error) {
        toast.error(
          error.response?.data?.message || "Something went wrong"
        );
      }
    });
  };

  const getPrivateMessages = async (chatId) => {

    const res = await axios.get(
      `http://localhost:5000/api/private/private-messages/${chatId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setPrivateMessages(res.data);
  };

  useEffect(() => {
    if (privateChat?._id) {
      getPrivateMessages(privateChat._id);
    }
  }, [privateChat]);


  const openPrivateChat = async (user) => {
    setShowUserInfo(false);
    setShowMedia(false);
    setPreviewImage(null);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/private/open-chat",
        { userId: user._id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setShowUserInfo(false);
      setSelectedUser(user);
      setSelectedGroup(null);

      setPrivateChat(res.data); // IMPORTANT
      getPrivateMessages(res.data._id); // IMPORTANT
        if (res.data?.updatedAt) {
      setUserLastActivity((prev) => ({
        ...prev,
        [user._id]: new Date(res.data.updatedAt).getTime(),
      }));
    }
      socket.emit(
        "joinPrivateChat",
        res.data._id
      );
    } catch (err) {
      console.log(err);
    }
  };



  useEffect(() => {

    socket.on(
      "receivePrivateMessage",
      (msg) => {

        setPrivateMessages(prev => [
          ...prev,
          msg
        ]);
const otherId =
      msg.sender?._id === user?._id
        ? msg.receiver?._id || msg.receiver
        : msg.sender?._id || msg.sender;

    if (otherId) {
      setUserLastActivity((prev) => ({ ...prev, [otherId]: Date.now() }));
    }

    const isReceiver =
      msg.receiver?._id === user?._id || msg.receiver === user?._id;

    const chatIsOpen =
      selectedUserRef.current &&
      (msg.sender?._id === selectedUserRef.current._id ||
        msg.sender === selectedUserRef.current._id);

    if (isReceiver && chatIsOpen) {
      socket.emit("markPrivateMessageSeen", {
        chatId: msg.chatId,
        messageId: msg._id,
        seenBy: user._id,
      });
    }
      }
    )
    return () => {

      socket.off(
        "receivePrivateMessage"
      );

    };

  }, []);

  useEffect(() => {
    socket.on("privateMessagesSeen", ({ messageIds }) => {
      setPrivateMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id) ? { ...m, seen: true } : m
        )
      );
    });

    return () => {
      socket.off("privateMessagesSeen");
    };
  }, []);


  useEffect(() => {

    socket.on("privateMessageUpdated", (msg) => {
      setPrivateMessages(prev =>
        prev.map(m =>
          m._id === msg._id ? msg : m
        )
      );
    });

    socket.on("privateMessageDeleted", (msg) => {
      setPrivateMessages(prev =>
        prev.map(m =>
          m._id === msg._id ? msg : m
        )
      );
    });

    return () => {

      socket.off("privateMessageUpdated");
      socket.off("privateMessageDeleted");


    };

  }, []);


  //  jab doosra user chat delete kare to yaha bhi turant clear ho jaaye
useEffect(() => {
  socket.on("privateChatDeleted", ({ chatId }) => {
    if (privateChat?._id === chatId) {
      setPrivateMessages([]);
      setPrivateChat(null);
      setSelectedUser(null);
      setShowUserInfo(false);
   
    }
  });

  return () => {
    socket.off("privateChatDeleted");
  };
}, [privateChat]);


  // TYPING INDICATOR LISTENERS
  useEffect(() => {

    socket.on("userTyping", ({ groupId, userId, userName }) => {
      if (userId === user?._id) return;
      setGroupTypingUsers((prev) => ({
        ...prev,
        [groupId]: { ...(prev[groupId] || {}), [userId]: userName },
      }));
    });

    socket.on("userStopTyping", ({ groupId, userId }) => {
      setGroupTypingUsers((prev) => {
        const groupMap = { ...(prev[groupId] || {}) };
        delete groupMap[userId];
        return { ...prev, [groupId]: groupMap };
      });
    });

    socket.on("userTypingPrivate", ({ senderId, userName }) => {
      if (senderId === user?._id) return;
      setPrivateTypingStatus((prev) => ({ ...prev, [senderId]: userName }));
    });

    socket.on("userStopTypingPrivate", ({ senderId }) => {
      setPrivateTypingStatus((prev) => {
        const copy = { ...prev };
        delete copy[senderId];
        return copy;
      });
    });

    return () => {
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("userTypingPrivate");
      socket.off("userStopTypingPrivate");
    };

  }, [user?._id]);


  const forwardMessage = (msg) => {
    setForwardingMsg(msg);
    setForwardTargets([]);
    setForwardSearch("");
    setShowForwardModal(true);
    setShowMsgMenu(null);
  };

  const toggleForwardTarget = (type, id) => {
    setForwardTargets((prev) => {
      const exists = prev.find((t) => t.type === type && t.id === id);
      if (exists) {
        return prev.filter((t) => !(t.type === type && t.id === id));
      }
      return [...prev, { type, id }];
    });
  };

  const sendForward = async () => {
    if (!forwardingMsg) return;

    if (forwardTargets.length === 0) {
      return toast.error("Select at least one group or chat");
    }

    setForwarding(true);

    try {

      let mediaFile = null;

      if (forwardingMsg.media) {
        const mediaRes = await fetch(
          `http://localhost:5000/uploads/${forwardingMsg.media}`
        );
        const blob = await mediaRes.blob();
        mediaFile = new File([blob], forwardingMsg.media, {
          type: blob.type,
        });
      }

      for (const target of forwardTargets) {

        const formData = new FormData();

        if (forwardingMsg.message) {
          formData.append("message", forwardingMsg.message);
        }

        if (mediaFile) {
          formData.append("media", mediaFile);
        }

        if (target.type === "group") {

          formData.append("groupId", target.id);

          const res = await axios.post(
            "http://localhost:5000/api/user/send-message",
            formData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          socket.emit("sendMessage", res.data);
          setGroupLastActivity((prev) => ({ ...prev, [target.id]: Date.now() }));

          if (selectedGroup?._id === target.id) {
            setMessages((prev) => [...prev, res.data]);
          }

        } else {

          const chatRes = await axios.post(
            "http://localhost:5000/api/private/open-chat",
            { userId: target.id },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          formData.append("chatId", chatRes.data._id);
          formData.append("receiverId", target.id);

          const res = await axios.post(
            "http://localhost:5000/api/private/send-private-message",
            formData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          socket.emit("sendPrivateMessage", res.data);
          setUserLastActivity((prev) => ({ ...prev, [target.id]: Date.now() }));

          if (privateChat?._id === chatRes.data._id) {
            setPrivateMessages((prev) => [...prev, res.data]);
          }

        }

      }

      toast.success(
        `Forwarded to ${forwardTargets.length} ${
          forwardTargets.length === 1 ? "chat" : "chats"
        }`
      );

      setShowForwardModal(false);
      setForwardingMsg(null);
      setForwardTargets([]);

    } catch (error) {
      console.log(error);
      toast.error("Forward failed");
    } finally {
      setForwarding(false);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  //GROUP TYPING
  const handleGroupTyping = (value) => {
    setMessage(value);

    if (!selectedGroup?._id) return;

    socket.emit("typing", {
      groupId: selectedGroup._id,
      userId: user._id,
      userName: user.name,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        groupId: selectedGroup._id,
        userId: user._id,
      });
    }, 1000);
  };

  // PRIVATE TYPING
  const handlePrivateTyping = (value) => {
    setMessage(value);

    if (!privateChat?._id || !selectedUser?._id) return;

    socket.emit("typingPrivate", {
      chatId: privateChat._id,
      senderId: user._id,
      receiverId: selectedUser._id,
      userName: user.name,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTypingPrivate", {
        chatId: privateChat._id,
        senderId: user._id,
        receiverId: selectedUser._id,
      });
    }, 1000);
  };

  const MAX_MEDIA_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > MAX_MEDIA_SIZE) {
      toast.error("File too large. Please select a file under 10 MB");
      e.target.value = "";
      setMedia(null);
      return;
    }

    setMedia(file);
  };

  const addUserToGroup = async () => {
    try {
      const res = await axios.put(
        "http://localhost:5000/api/users/add-user",
        {
          groupId: selectedGroup._id,
          userId: selectedUser,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        res.data.message
      );

      setSelectedGroup(
        res.data.group
      );

      setGroups((prev) =>
        prev.map((group) =>
          group._id ===
            res.data.group._id
            ? res.data.group
            : group
        )
      );

      setSelectedUser("");

    } catch (error) {
      toast.error(
        error.response?.data
          ?.message ||
        "Something went wrong"
      );
    }
  };
  const deleteMessage = async (id) => {

    const res = await axios.delete(
      `http://localhost:5000/api/private/delete-message/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setPrivateMessages(prev =>
      prev.map(m =>
        m._id === id
          ? res.data
          : m
      )
    );

    setShowMsgMenu(null);
  };
  const handleReply = (msg) => {
    setReplyingTo(msg);
    setShowMsgMenu(null);
  };

  const updateMessage = (msg) => {

    if (msg.isDeleted) return;

    setEditingMessage(msg);
    setMessage(msg.message);
    setShowMsgMenu(null);

  };

  const deleteGroupMessage = async (id) => {

    const res = await axios.delete(
      `http://localhost:5000/api/user/delete-message/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log(res.data);
    setMessages(prev =>
      prev.map(m =>
        m._id === id
          ? res.data
          : m
      )
    );

    setShowMsgMenu(null);
  };



  const updateGroupMessage = (msg) => {

    setEditingMessage(msg);

    setMessage(msg.message);

    setShowMsgMenu(null);

  };

  const leaveGroup = async () => {
    try {
      const res = await axios.put(
        "http://localhost:5000/api/users/leave-group",
        {
          groupId: selectedGroup._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(res.data.message);

      setGroups((prev) =>
        prev.filter(
          (group) =>
            group._id !== selectedGroup._id
        )
      );

      setSelectedGroup(null);
      setShowGroupInfo(false);

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Something went wrong"
      );
    }
  };

  const handleLeaveGroup = () => {
    Swal.fire({
      title: "Leave Group?",
      text: "You will no longer receive messages from this group.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Leave Group",
    }).then((result) => {
      if (result.isConfirmed) {
        leaveGroup();
      }
    });
  };


// DELETE PRIVATE CHAT
const deleteChat = async () => {
  try {
    const res = await axios.delete(
      `http://localhost:5000/api/private/delete-chat/${privateChat._id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    toast.success(res.data.message);

    // sidebar list se turant activity clear karo
    setUserLastActivity((prev) => {
      const copy = { ...prev };
      delete copy[selectedUser._id];
      return copy;
    });

    setPrivateMessages([]);
    setPrivateChat(null);
    setSelectedUser(null);
    setShowUserInfo(false);

  } catch (error) {
    toast.error(
      error.response?.data?.message || "Could not delete chat"
    );
  }
};

const handleClearGroupChat = () => {
  Swal.fire({
    title: "Clear Chat?",
    text: "All messages in this group will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Clear Chat",
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/user/clear-group-chat/${selectedGroup._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages([]);
      toast.success(res.data.message);
      

    } catch (error) {
      toast.error(error.response?.data?.message || "Could not clear chat");
    }
  });
};
useEffect(() => {
  socket.on("groupChatCleared", ({ groupId }) => {
    if (selectedGroup?._id === groupId) {
      setMessages([]);
    }
  });

  return () => socket.off("groupChatCleared");
}, [selectedGroup]);

const handleDeleteChat = () => {
  Swal.fire({
    title: "Delete Chat?",
    text: "All messages will be permanently deleted for both of you.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Delete Chat",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteChat();
    }
  });
};

  const removeMember = async (memberId) => {
    try {

      const res = await axios.put(
        "http://localhost:5000/api/users/remove-member",
        {
          groupId: selectedGroup._id,
          userId: memberId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedGroup(
        res.data.group
      );

      setGroups((prev) =>
        prev.map((group) =>
          group._id === res.data.group._id
            ? res.data.group
            : group
        )
      );

      Swal.fire({
        icon: "success",
        title: "Member Removed",
        timer: 1500,
        showConfirmButton: false,
      })

    } catch (error) {

      Swal.fire({
        icon: "error",
        title:
          error.response?.data?.message ||
          "Something went wrong",
      });

    }
  };


  const handleRemoveMember = (
    member
  ) => {
    Swal.fire({
      title: "Remove Member?",
      text: `Do you want to remove ${member.name} from this group?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText:
        "Yes, Remove",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        removeMember(member._id);
      }
    });
  };


  const deleteGroup = async () => {
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/user/delete-group/${selectedGroup._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        res.data.message
      );

      setGroups((prev) =>
        prev.filter(
          (group) =>
            group._id !==
            selectedGroup._id
        )
      );

      setSelectedGroup(null);
      setShowGroupInfo(false);

    } catch (error) {
      toast.error(
        error.response?.data?.message
      );
    }
  };


  const handleDeleteGroup = () => {
    Swal.fire({
      title: "Delete Group?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText:
        "Delete Group",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteGroup();
      }
    });
  };


  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);

  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState("");


  const createGroup = async () => {
    try {
      const formData = new FormData();

      formData.append("groupName", groupName);

      formData.append(
        "members",
        JSON.stringify(
          members.map(
            (member) => member.email
          )
        )
      );
      if (!groupName || !groupImage) {
        return toast.error("All fields are required")
      }
      if (members.length === 0) {
        return toast.error(
          "Please select at least one member"
        );
      }
      if (groupImage) {
        formData.append("groupImage", groupImage);
      }

      const res = await axios.post(
        "http://localhost:5000/api/user/create-group",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(members)
      getMyGroups()
  const modalEl = document.getElementById("createGroupModal");
      const modal = window.bootstrap?.Modal?.getInstance(modalEl);
      modal?.hide();
      Swal.fire({
        icon: "success",
        title: res.data.message,
      });

      setGroupName("");
      setGroupImage(null);
      setMembers([]);
      setMemberEmail("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title:
          error.response?.data?.message ||
          "Something went wrong",
      });
    }
  };
  const joinGroup = async () => {
    if (!joinCode.trim()) {
      return toast.error("Please enter an invite code");
    }

    setJoiningGroup(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/user/join-group",
        { inviteCode: joinCode.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(res.data.message);

      setGroups((prev) => {
        const exists = prev.find((g) => g._id === res.data.group._id);
        return exists ? prev : [...prev, res.data.group];
      });

      setJoinCode("");
      setShowJoinModal(false);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Invalid code or something went wrong"
      );
    } finally {
      setJoiningGroup(false);
    }
  };

  const regenerateCode = async () => {
    if (!selectedGroup) return;

    Swal.fire({
      title: "Regenerate Code?",
      text: "The old invite code will stop working immediately.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, Regenerate",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      setRegenLoading(true);
      try {
        const res = await axios.put(
          `http://localhost:5000/api/user/regenerate-code/${selectedGroup._id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSelectedGroup((prev) => ({
          ...prev,
          inviteCode: res.data.inviteCode,
        }));

        setGroups((prev) =>
          prev.map((g) =>
            g._id === selectedGroup._id
              ? { ...g, inviteCode: res.data.inviteCode }
              : g
          )
        );

        toast.success("New invite code generated");

      } catch (error) {
        toast.error(
          error.response?.data?.message || "Could not regenerate code"
        );
      } finally {
        setRegenLoading(false);
      }
    });
  };


  // 👇 NAYA — EDIT GROUP PROFILE
const openEditGroupModal = () => {
  setEditGroupName(selectedGroup.groupName);
  setEditGroupImage(null);
  setShowEditGroupModal(true);
};

const updateGroupProfile = async () => {
  if (!editGroupName.trim()) {
    return toast.error("Group name cannot be empty");
  }

  setEditGroupLoading(true);

  try {
    const formData = new FormData();
    formData.append("groupName", editGroupName.trim());

    if (editGroupImage) {
      formData.append("groupImage", editGroupImage);
    }

    const res = await axios.put(
      `http://localhost:5000/api/user/update-group/${selectedGroup._id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSelectedGroup(res.data.group);

    setGroups((prev) =>
      prev.map((g) =>
        g._id === res.data.group._id ? res.data.group : g
      )
    );

    toast.success(res.data.message);
    setShowEditGroupModal(false);

  } catch (error) {
    toast.error(
      error.response?.data?.message || "Could not update group"
    );
  } finally {
    setEditGroupLoading(false);
  }
};
  const copyInviteCode = () => {
    if (!selectedGroup?.inviteCode) return;
    navigator.clipboard.writeText(selectedGroup.inviteCode);
    toast.success("Invite code copied!");
  };

  const getMyGroups = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/user/get-my-group",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setGroups(res.data.groups);
       const activityMap = {};
    res.data.groups.forEach((g) => {
      activityMap[g._id] = new Date(
        g.updatedAt || g.createdAt || Date.now()
      ).getTime();
    });
    setGroupLastActivity((prev) => ({ ...prev, ...activityMap }));
    } catch (error) {
      console.log(error);
    }
  };

  const getMessages = async () => {
    try {
      if (!selectedGroup) return;

      const res = await axios.get(
        `http://localhost:5000/api/user/messages/${selectedGroup._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages(res.data);
    } catch (error) {
      console.log(error);
    }
  };



  const sendMessage = async () => {

    if (editingMessage) {

      const res = await axios.put(
        `http://localhost:5000/api/user/update-message/${editingMessage._id}`,
        {
          message
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessages(prev =>
        prev.map(m =>
          m._id === editingMessage._id
            ? res.data
            : m
        )
      );

      setEditingMessage(null);
      setMessage("");

      return;
    }

    if (!message.trim() && !media) return;

    if (!selectedGroup?._id) {
      toast.error("No group selected");
      return;
    }

    const formData = new FormData();
    formData.append("groupId", selectedGroup._id);
    if (replyingTo) {
      formData.append("replyTo", replyingTo._id);
    }

    if (message.trim()) {
      formData.append("message", message);
    }

    if (media) {
      formData.append("media", media);
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/user/send-message",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("sendMessage", res.data);

      // 
      // 
      // 
      //  — message bhejte hi typing turant band karo
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("stopTyping", {
        groupId: selectedGroup._id,
        userId: user._id,
      });

setGroupLastActivity((prev) => ({
  ...prev,
  [selectedGroup._id]: Date.now(),
}));

      setMessage("");
      setMedia(null);
      setReplyingTo(null);
    } catch (error) {
      console.log(error);
      toast.error("Message failed");
    }
  };

  const sendPrivateMessage = async () => {

    if (editingMessage) {

      const res = await axios.put(
        `http://localhost:5000/api/private/update-message/${editingMessage._id}`,
        {
          message
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      setPrivateMessages(prev =>
        prev.map(m =>
          m._id === editingMessage._id
            ? res.data
            : m
        )
      );

      setEditingMessage(null);
      setMessage("");
      setMedia(null);
      setShowMsgMenu(null);

      return;
    }

    // SEND NEW MESSAGE
    if (!message.trim() && !media) return;

    if (!privateChat?._id) {
      toast.error("Chat not initialized");
      return;
    }

    if (!selectedUser?._id) {
      toast.error("No user selected");
      return;
    }

    const formData = new FormData();

    formData.append("chatId", privateChat._id);
    formData.append("receiverId", selectedUser._id);

    if (replyingTo) {
      formData.append("replyTo", replyingTo._id);
    }

    if (message.trim()) {
      formData.append("message", message);
    }

    if (media) {
      formData.append("media", media);
    }

    try {

      const res = await axios.post(
        "http://localhost:5000/api/private/send-private-message",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      socket.emit("sendPrivateMessage", res.data);

      // 👇 NAYA — message bhejte hi typing turant band karo
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("stopTypingPrivate", {
        chatId: privateChat._id,
        senderId: user._id,
        receiverId: selectedUser._id,
      });

      setUserLastActivity((prev) => ({
  ...prev,
  [selectedUser._id]: Date.now(),
}));

      setMessage("");
      setMedia(null);
      setReplyingTo(null);

    } catch (error) {
      console.log(error);
      toast.error("Private message failed");
    }
  };
  const handleSend = () => {

    if (selectedUser) {
      if (isUserBlocked(selectedUser._id)) {
        return toast.error("Unblock this user to send a message");
      }
      sendPrivateMessage();
    } else {
      sendMessage(); // group wala as it is
    }
  };
  useEffect(() => {
    getAllUsers();
    getBlockedUsers();

    if (user?._id) {
      socket.emit("userOnline", user._id);
    }

    socket.on("onlineUsers", (ids) => {
      setOnlineUsers(ids);
    });

    return () => {
      socket.off("onlineUsers");
    };
  }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  useEffect(() => {
    getMyGroups();
  }, []);
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
       const gId = msg.group?._id || msg.group || msg.groupId;
    if (gId) {
      setGroupLastActivity((prev) => ({ ...prev, [gId]: Date.now() }));
    }
    });
    

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  useEffect(() => {

    socket.on("groupMessageUpdated", (msg) => {
      setMessages(prev =>
        prev.map(m =>
          m._id === msg._id ? msg : m
        )
      );
    });

    socket.on("groupMessageDeleted", (msg) => {
      setMessages(prev =>
        prev.map(m =>
          m._id === msg._id ? msg : m
        )
      );
    });


    return () => {
      socket.off("groupMessageUpdated");
      socket.off("groupMessageDeleted");

    };

  }, []);
  useEffect(() => {
    if (selectedGroup) {
      socket.emit(
        "joinGroup",
        selectedGroup._id
      );

      getMessages();
    }
  }, [selectedGroup]);
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, selectedGroup]);

  useEffect(() => {
    if (privateMessagesRef.current) {
      privateMessagesRef.current.scrollTop =
        privateMessagesRef.current.scrollHeight;
    }
  }, [privateMessages, selectedUser]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Logout",
      confirmButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        if (user?._id) {
          socket.emit("userOffline", user._id);
        }
        dispatch(logout());
        navigate("/");
      }
    });
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        msgMenuRef.current &&
        !msgMenuRef.current.contains(e.target)
      ) {
        setShowMsgMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const formatTime = (createdAt) =>
    createdAt
      ? new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const getDateLabel = (dateStr) => {
    if (!dateStr) return "";

    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    if (isSameDay(msgDate, today)) return "Today";
    if (isSameDay(msgDate, yesterday)) return "Yesterday";

    return msgDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!currentMsg?.createdAt) return false;
    if (!prevMsg?.createdAt) return true;

    const d1 = new Date(currentMsg.createdAt);
    const d2 = new Date(prevMsg.createdAt);

    return (
      d1.getDate() !== d2.getDate() ||
      d1.getMonth() !== d2.getMonth() ||
      d1.getFullYear() !== d2.getFullYear()
    );
  };

  const chatOpen = Boolean(selectedGroup || selectedUser);

  const goBackToList = () => {
    setSelectedGroup(null);
    setSelectedUser(null);
    setShowGroupInfo(false);
    setShowUserInfo(false);
    setShowMedia(false);
    setPreviewImage(null);
  };

  const sortedGroups = useMemo(() => {
  return [...groups].sort((a, b) => {
    const ta = groupLastActivity[a._id] || new Date(a.createdAt || 0).getTime();
    const tb = groupLastActivity[b._id] || new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });
}, [groups, groupLastActivity]);

const sortedUsers = useMemo(() => {
  return [...users].sort((a, b) => {
    const ta = userLastActivity[a._id] || 0;
    const tb = userLastActivity[b._id] || 0;
    return tb - ta;
  });
}, [users, userLastActivity]);


  const currentGroupTypingNames = selectedGroup
    ? Object.values(groupTypingUsers[selectedGroup._id] || {})
    : [];

  const isPrivateUserTyping = Boolean(
    selectedUser && privateTypingStatus[selectedUser._id]
  );

  return (<>

    <div className="container-fluid px-2 px-md-3 px-lg-4 mt-md-5 mt-2 cv-page-container">

      <div className="cv-shell">

        <div className="row g-0 cv-grid">

          <div
            className={`col-12 col-md-4 p-0 ${
              chatOpen ? "d-none d-md-block" : "d-block"
            }`}
          >
            <SideBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sortedGroup={sortedGroups}
              sortedUsers={sortedUsers}
              setSelectedGroup={setSelectedGroup}
              setSelectedUser={setSelectedUser}
              openPrivateChat={openPrivateChat}
              setShowGroupInfo={setShowGroupInfo}
              setShowMedia={setShowMedia}
              setPreviewImage={setPreviewImage}
              showMenu={showMenu}
              setShowMenu={setShowMenu}
              handleLogout={handleLogout}
              menuRef={menuRef}
              isOnline={isOnline}
              user={user}
              groupTypingUsers={groupTypingUsers}
              privateTypingStatus={privateTypingStatus}
            />
          </div>

          <div
            className={`col-12 col-md-8 p-0 ${
              chatOpen ? "d-block" : "d-none d-md-block"
            }`}
          >
          <div className="cv-main">
            {selectedUser ? (

              showUserInfo ? (

                <div className="cv-info">

                  <div className="cv-info-header">
                    <i
                      className="fa-solid fa-arrow-left d-md-none cv-back-btn"
                      onClick={goBackToList}
                    ></i>
                    <h5>Contact</h5>

                    <i
                      className="fa-solid fa-xmark"
                      onClick={() => setShowUserInfo(false)}
                    ></i>
                  </div>

                  <div className="cv-info-top">

                    <div className="cv-avatar-wrap cv-avatar-wrap-lg">
                      <img
                        src={`http://localhost:5000/uploads/${selectedUser.image}`}
                        className="cv-info-avatar"
                        alt=""
                        onClick={() =>
                          setPreviewImage(
                            `http://localhost:5000/uploads/${selectedUser.image}`
                          )
                        }
                      />
                      {isOnline(selectedUser._id) && (
                        <span className="cv-online-dot cv-online-dot-lg"></span>
                      )}
                    </div>

                    <h2>{selectedUser.name}</h2>

                    <p>
                      {isOnline(selectedUser._id) ? (
                        <span className="cv-online-text">● Online</span>
                      ) : (
                        selectedUser.email
                      )}
                    </p>

                  </div>

                  <hr className="cv-divider" />

                  <div className="cv-actions">
                    <div
                      className="cv-action"
                      onClick={() => setShowMedia(!showMedia)}
                    >
                      <div className="cv-action-circle">
                        <i className="fa-solid fa-images"></i>
                      </div>
                      <p>Media</p>
                    </div>

                    <div className="cv-action danger" onClick={toggleBlockUser}>
                      <div className="cv-action-circle">
                        <i
                          className={`fa-solid ${
                            isUserBlocked(selectedUser._id) ? "fa-circle-check" : "fa-ban"
                          }`}
                        ></i>
                      </div>
                      <p>{isUserBlocked(selectedUser._id) ? "Unblock" : "Block"}</p>
                    </div>
                     <div className="cv-action danger" onClick={handleDeleteChat}>
    <div className="cv-action-circle">
      <i className="fa-solid fa-trash-can"></i>
    </div>
    <p>Delete Chat</p>
  </div>
                  </div>

                  {isUserBlocked(selectedUser._id) && (
                    <p className="cv-empty-note">
                      You have blocked this user. They can't send you messages.
                    </p>
                  )}

                  {showMedia && (
                    <div>

                      {privateMessages.filter(msg => msg.media).length === 0 ? (

                        <p className="cv-empty-note">
                          No media shared yet
                        </p>

                      ) : (

                        <div className="cv-media-grid">

                          {privateMessages
                            .filter(msg => msg.media)
                            .map(msg => (

                              <div key={msg._id}>

                                {msg.mediaType === "image" ? (

                                  <img
                                    src={`http://localhost:5000/uploads/${msg.media}`}
                                    alt=""
                                    onClick={() =>
                                      setPreviewImage(
                                        `http://localhost:5000/uploads/${msg.media}`
                                      )
                                    }
                                  />

                                ) : (

                                  <video
                                    controls
                                    src={`http://localhost:5000/uploads/${msg.media}`}
                                  />

                                )}

                              </div>

                            ))}

                        </div>

                      )}

                    </div>
                  )}

                </div>

              ) : (
                <>

                  {/* HEADER */}
                  <div className="cv-thread-header">

                    <div className="cv-thread-id" onClick={() => setShowUserInfo(true)}>

                      <i
                        className="fa-solid fa-arrow-left d-md-none cv-back-btn"
                        onClick={goBackToList}
                      ></i>

                      <div className="cv-avatar-wrap"   >
                        <img  
                          src={`http://localhost:5000/uploads/${selectedUser.image}`}
                          alt=""
                          className="cv-thread-avatar"
                        />
                        {isOnline(selectedUser._id) && (
                          <span className="cv-online-dot"></span>
                        )}
                      </div>

                      <div>
                        <h5>{selectedUser.name}</h5>
                        <small>
                          {isPrivateUserTyping ? (
                            <span className="cv-typing-text">typing…</span>
                          ) : isOnline(selectedUser._id) ? (
                            <span className="cv-online-text">Online</span>
                          ) : (
                            selectedUser.email
                          )}
                        </small>
                      </div>

                    </div>

                    <div className="cv-thread-actions">
                      <i className="fa-solid fa-phone"></i>
                      <i className="fa-solid fa-video"></i>
                      <i
                        className="fa-solid fa-circle-info"
                        onClick={() => setShowUserInfo(true)}
                      ></i>
                    </div>

                  </div>

                  {/* MESSAGES */}
                  <div className="cv-thread" ref={privateMessagesRef}>

                    {privateMessages.length === 0 ? (
                      <div className="cv-thread-empty">
                        No messages yet — start the conversation
                      </div>
                    ) : (
                      privateMessages.map((msg, index) => {
                        const isMe = msg.sender?._id === user?._id;
                        const side = isMe ? "mine" : "theirs";
                        const showDateSeparator = shouldShowDateSeparator(
                          msg,
                          privateMessages[index - 1]
                        );

                        return (
                          <React.Fragment key={msg._id}>

                          {showDateSeparator && (
                            <div className="cv-date-separator">
                              <span>{getDateLabel(msg.createdAt)}</span>
                            </div>
                          )}

                          <div className={`cv-msg-row ${side}`}>

                            {!isMe && (
                              <div className="cv-bubble-avatar-wrap">
                                <img
                                  src={`http://localhost:5000/uploads/${msg.sender?.image}`}
                                  alt=""
                                  className="cv-bubble-avatar"
                                />
                                {isOnline(msg.sender?._id) && (
                                  <span className="cv-online-dot cv-online-dot-xs"></span>
                                )}
                              </div>
                            )}

                            <div className={`cv-bubble ${side}`}>

                              {!msg.isDeleted && (
                                <div
                                  className="cv-menu-trigger"
                                  ref={showMsgMenu === msg._id ? msgMenuRef : null}
                                >
                                  <i
                                    className="fa-solid fa-ellipsis-vertical"
                                    onClick={() =>
                                      setShowMsgMenu(
                                        showMsgMenu === msg._id ? null : msg._id
                                      )
                                    }
                                  />

                                  {showMsgMenu === msg._id && (
                                    <div className={`cv-dropdown ${side}`}>
                                      <div onClick={() => handleReply(msg)}>Reply</div>
                                      <div onClick={() => forwardMessage(msg)}>Forward</div>
                                      {isMe && (
                                        <>
                                          <div onClick={() => updateMessage(msg)}>Edit</div>
                                          <div onClick={() => deleteMessage(msg._id)}>Delete</div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {!isMe && (
                                <div className="cv-sender">{msg.sender?.name}</div>
                              )}

                              {msg.replyTo && (
                                <div className="cv-reply-box">
                                  <div className="cv-reply-user">{msg.replyTo.sender?.name}</div>
                                  <div className="cv-reply-text">
                                    {msg.replyTo.isDeleted ? "This message was deleted" : msg.replyTo.message}
                                  </div>
                                </div>
                              )}

                              {msg.message && (
                                <div className={`cv-msg-text ${msg.isDeleted ? "deleted" : ""}`}>
                                  {msg.message}
                                  {msg.isEdited && !msg.isDeleted && (
                                    <div className="cv-edited-tag">edited</div>
                                  )}
                                </div>
                              )}

                              {msg.media && (
                                <>
                                  {msg.mediaType === "image" ? (
                                    <img
                                      src={`http://localhost:5000/uploads/${msg.media}`}
                                      className="cv-media"
                                      alt=""
                                      onClick={() =>
                                        setPreviewImage(`http://localhost:5000/uploads/${msg.media}`)
                                      }
                                    />
                                  ) : (
                                    <video
                                      src={`http://localhost:5000/uploads/${msg.media}`}
                                      className="cv-media"
                                      controls
                                    />
                                  )}
                                </>
                              )}

                              <div className="cv-stamp">
                                {formatTime(msg.createdAt)}
                                {isMe && !msg.isDeleted && (
                                  <i
                                    className={`fa-solid ${
                                      msg.seen
                                        ? "fa-check-double cv-tick-seen"
                                        : "fa-check cv-tick-sent"
                                    }`}
                                  ></i>
                                )}
                              </div>

                            </div>

                          </div>

                          </React.Fragment>
                        );
                      })
                    )}

                 

                  </div>

                  {replyingTo && (
                    <div className="cv-strip">
                      <div>
                        <span className="cv-strip-label">Replying to {replyingTo.sender?.name}</span>
                        <p>{replyingTo.message}</p>
                      </div>
                      <i className="fa-solid fa-xmark" onClick={() => setReplyingTo(null)}></i>
                    </div>
                  )}

                  {editingMessage && (
                    <div className="cv-strip">
                      <span className="cv-strip-label">Editing message</span>
                      <i
                        className="fa-solid fa-xmark"
                        onClick={() => {
                          setEditingMessage(null);
                          setMessage("");
                        }}
                      ></i>
                    </div>
                  )}

                  {media && (
                    <div className="cv-media-stage">
                      {media.type.startsWith("image") ? (
                        <img src={URL.createObjectURL(media)} alt="" />
                      ) : (
                        <video src={URL.createObjectURL(media)} controls />
                      )}
                      <i className="fa-solid fa-xmark cv-media-remove" onClick={() => setMedia(null)}></i>
                    </div>
                  )}

                  {isUserBlocked(selectedUser._id) ? (
                    <div className="cv-blocked-banner">
                      <i className="fa-solid fa-ban"></i>
                      You blocked this user — unblock from their info page to send messages.
                    </div>
                  ) : (
                    <div className="cv-composer">

                      <div
                        className="cv-attach"
                        onClick={() => document.getElementById("privateMediaInput").click()}
                      >
                        <i className="fa-solid fa-images"></i>
                      </div>

                      <input
                        id="privateMediaInput"
                        type="file"
                        hidden
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                      />

                      <input
                        type="text"
                        placeholder="Write a message…"
                        value={message}
                        onChange={(e) => handlePrivateTyping(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSend();
                        }}
                      />

                      <button className="cv-send" onClick={handleSend}>
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>

                    </div>
                  )}

                </>
              )
            ) : !selectedGroup ? (

              <div className="cv-blank">
                <div className="cv-blank-mark">
                  <i className="fa-solid fa-feather-pointed"></i>
                </div>
                <h2>Talkify</h2>
                <p>Connect · Converse · Collaborate</p>
              </div>

            ) : showGroupInfo ? (

              <div className="cv-info">

                <div className="cv-info-header">
                  <i
                    className="fa-solid fa-arrow-left d-md-none cv-back-btn"
                    onClick={goBackToList}
                  ></i>
                  <h5>Group Info</h5>
                  <i className="fa-solid fa-xmark" onClick={() => setShowGroupInfo(false)}></i>
                </div>

                <div className="cv-info-top">

                  <img
                    src={`http://localhost:5000/uploads/${selectedGroup.groupImage}`}
                    alt=""
                    className="cv-info-avatar"
                    onClick={() =>
                      setPreviewImage(`http://localhost:5000/uploads/${selectedGroup.groupImage}`)
                    }
                  />

                  <h2>{selectedGroup.groupName}</h2>

                  <p>Group · {selectedGroup.members.length} members</p>

                </div>

                <hr className="cv-divider" />

                <div className="cv-actions">

                {selectedGroup?.createdBy?._id === user?._id && (
    <div className="cv-action" onClick={openEditGroupModal}>
      <div className="cv-action-circle">
        <i className="fa-solid fa-pen"></i>
      </div>
      <p>Edit</p>
    </div>
  )}

  {selectedGroup?.createdBy?._id === user?._id && (
    <div className="cv-action" onClick={() => setShowAddUserModal(true)}>
      <div className="cv-action-circle">
        <i className="fa-solid fa-user-plus"></i>
      </div>
      <p>Add</p>
    </div>
  )}

  <div className="cv-action" onClick={() => setShowMedia(!showMedia)}>
    <div className="cv-action-circle">
      <i className="fa-solid fa-images"></i>
    </div>
    <p>Media</p>
  </div>
  {selectedGroup?.createdBy?._id === user?._id && (
  <div className="cv-action danger" onClick={handleClearGroupChat}>
    <div className="cv-action-circle">
      <i className="fa-solid fa-broom"></i>
    </div>
    <p>Clear Chat</p>
  </div>
)}
 
                  {selectedGroup?.createdBy?._id !== user?._id && (
                    <div className="cv-action danger" onClick={handleLeaveGroup}>
                      <div className="cv-action-circle">
                        <i className="fa-solid fa-right-from-bracket"></i>
                      </div>
                      <p>Leave</p>
                    </div>
                  )}

                  {selectedGroup?.createdBy?._id === user?._id && (
                    <div className="cv-action danger" onClick={handleDeleteGroup}>
                      <div className="cv-action-circle">
                        <i className="fa-solid fa-trash-can"></i>
                      </div>
                      <p>Delete</p>
                    </div>
                  )}

                </div>

                {selectedGroup?.createdBy?._id === user?._id && (
                  <div className="cv-invite-code-box">
                    <div className="cv-invite-code-label">
                      <i className="fa-solid fa-key"></i>
                      Invite Code
                    </div>

                                    <div className="cv-invite-code-row">
                      <span className="cv-invite-code-value">
                        {selectedGroup.inviteCode}
                      </span>

                      <div className="cv-invite-code-actions">
                        <button
                          className="cv-code-btn"
                          onClick={copyInviteCode}
                          title="Copy code"
                        >
                          <i className="fa-solid fa-copy"></i>
                        </button>

                        <button
                          className="cv-code-btn cv-code-btn-danger"
                          onClick={regenerateCode}
                          disabled={regenLoading}
                          title="Regenerate code"
                        >
                          <i
                            className={`fa-solid fa-rotate-right ${
                              regenLoading ? "fa-spin" : ""
                            }`}
                          ></i>
                        </button>
                      </div>
                    </div>

                    <p className="cv-invite-code-hint">
                      Share this code with people you want to invite. Regenerate to invalidate the old one.
                    </p>
                  </div>
                )}

                {showMedia && (
                  <div>

                    {messages.filter((msg) => msg.media).length === 0 ? (
                      <p className="cv-empty-note">No media shared yet</p>
                    ) : (
                      <div className="cv-media-grid">

                        {messages
                          .filter((msg) => msg.media)
                          .map((msg) => (
                            <div key={msg._id}>
                              {msg.media.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? (
                                <video controls src={`http://localhost:5000/uploads/${msg.media}`} />
                              ) : (
                                <img
                                  src={`http://localhost:5000/uploads/${msg.media}`}
                                  alt=""
                                  onClick={() =>
                                    setPreviewImage(`http://localhost:5000/uploads/${msg.media}`)
                                  }
                                />
                              )}
                            </div>
                          ))}

                      </div>
                    )}

                  </div>
                )}

                {previewImage && (
                  <div className="cv-lightbox" onClick={() => setPreviewImage(null)}>
                    <div className="cv-lightbox-content" onClick={(e) => e.stopPropagation()}>
                      <img src={previewImage} alt="" />
                      <div className="cv-lightbox-actions">
                        <a href={previewImage} download><i className="fa-solid fa-download"></i></a>
                        <button onClick={() => setPreviewImage(null)}><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    </div>
                  </div>
                )}

{/* edit group modal */}

<div className={`modal fade ${showEditGroupModal ? "show d-block" : ""}`} tabIndex="-1">
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content cv-modal-content">

      <div className="modal-header cv-modal-header">
        <h5 className="modal-title">
          <i className="fa-solid fa-pen me-2"></i>
          Edit group
        </h5>
        <button
          type="button"
          className="btn-close"
          onClick={() => setShowEditGroupModal(false)}
        ></button>
      </div>

      <div className="modal-body">

        <div className="text-center mb-4">

          <img
            src={
              editGroupImage
                ? URL.createObjectURL(editGroupImage)
                : `http://localhost:5000/uploads/${selectedGroup?.groupImage}`
            }
            alt="Group preview"
            style={{
              width: "104px",
              height: "104px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />

          <input
            type="file"
            className="form-control mt-3 cv-input"
            accept="image/*"
            onChange={(e) => setEditGroupImage(e.target.files[0])}
          />
        </div>

        <div className="mb-3">
          <label className="cv-field-label">Group name</label>
          <input
            type="text"
            className="form-control cv-input"
            placeholder="Enter group name"
            value={editGroupName}
            onChange={(e) => setEditGroupName(e.target.value)}
          />
        </div>

      </div>

      <div className="modal-footer border-0">
        <button
          className="cv-btn-ghost"
          onClick={() => setShowEditGroupModal(false)}
        >
          Cancel
        </button>

        <button
          className="cv-btn-primary"
          onClick={updateGroupProfile}
          disabled={editGroupLoading}
        >
          {editGroupLoading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin me-2"></i>
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>

    </div>
  </div>
</div>

                <div className="cv-members">

                  <h5>Members</h5>

                  {[...selectedGroup.members]
                    .sort((a, b) => {
                      if (a._id === selectedGroup?.createdBy?._id) return -1;
                      if (b._id === selectedGroup?.createdBy?._id) return 1;
                      return 0;
                    })
                    .map((member) => (
                      <div key={member._id} className="cv-member-row">

                        <div className="cv-member-left">
                          <img src={`http://localhost:5000/uploads/${member.image}`} alt="" />
                          <span>{member.name}</span>
                        </div>

                        {member._id === selectedGroup?.createdBy?._id ? (
                          <span className="cv-admin-tag">Admin</span>
                        ) : (
                          selectedGroup?.createdBy?._id === user?._id && (
                            <i
                              onClick={() => handleRemoveMember(member)}
                              className="fa-solid fa-trash-can cv-member-remove"
                            ></i>
                          )
                        )}

                      </div>
                    ))}

                </div>

              </div>

            ) : (

              <>

                <div className="cv-thread-header">

                  <div className="cv-thread-id" onClick={() => setShowGroupInfo(true)}>

                    <i
                      className="fa-solid fa-arrow-left d-md-none cv-back-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        goBackToList();
                      }}
                    ></i>

                    <img 
                      src={`http://localhost:5000/uploads/${selectedGroup.groupImage}`}
                      alt=""
                      className="cv-thread-avatar"
                    />

                    <div>
                      <h5>{selectedGroup.groupName}</h5>
                      <small>
                        {currentGroupTypingNames.length > 0
                          ? `${currentGroupTypingNames.join(", ")} is typing…`
                          : `${selectedGroup.members.length} members`}
                      </small>
                    </div>

                  </div>

                  <div className="cv-thread-actions">
                    <i className="fa-solid fa-phone"></i>
                    <i className="fa-solid fa-video"></i>
                    <i className="fa-solid fa-circle-info" onClick={() => setShowGroupInfo(true)}></i>
                  </div>

                </div>

                <div className="cv-thread" ref={messagesContainerRef}>

                  {messages.map((msg, index) => {

                    const senderName = msg.sender?.name || msg.sender;
                    const isMe = senderName === user?.name;
                    const side = isMe ? "mine" : "theirs";
                    const showDateSeparator = shouldShowDateSeparator(
                      msg,
                      messages[index - 1]
                    );

                    return (

                      <React.Fragment key={msg._id || index}>

                      {showDateSeparator && (
                        <div className="cv-date-separator">
                          <span>{getDateLabel(msg.createdAt)}</span>
                        </div>
                      )}

                      <div className={`cv-msg-row ${side}`}>

                        {!isMe && (
                          <div className="cv-bubble-avatar-wrap">
                            <img
                              src={`http://localhost:5000/uploads/${msg.sender?.image}`}
                              alt=""
                              className="cv-bubble-avatar"
                            />
                            {isOnline(msg.sender?._id) && (
                              <span className="cv-online-dot cv-online-dot-xs"></span>
                            )}
                          </div>
                        )}

                        <div className={`cv-bubble ${side}`}>

                          {!msg.isDeleted && (
                            <div
                              className="cv-menu-trigger"
                              ref={showMsgMenu === msg._id ? msgMenuRef : null}
                            >
                              <i
                                className="fa-solid fa-ellipsis-vertical"
                                onClick={() =>
                                  setShowMsgMenu(showMsgMenu === msg._id ? null : msg._id)
                                }
                              />

                              {showMsgMenu === msg._id && (
                                <div className={`cv-dropdown ${side}`}>
                                  <div onClick={() => handleReply(msg)}>Reply</div>
                                  <div onClick={() => forwardMessage(msg)}>Forward</div>
                                  {isMe && (
                                    <>
                                      <div onClick={() => updateGroupMessage(msg)}>Edit</div>
                                      <div onClick={() => deleteGroupMessage(msg._id)}>Delete</div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {!isMe && <div className="cv-sender">{senderName}</div>}

                          {msg.replyTo && (
                            <div className="cv-reply-box">
                              <div className="cv-reply-user">{msg.replyTo.sender?.name}</div>
                              <div className="cv-reply-text">
                                {msg.replyTo.isDeleted ? "This message was deleted" : msg.replyTo.message}
                              </div>
                            </div>
                          )}

                          {msg.message && (
                            <div className={`cv-msg-text ${msg.isDeleted ? "deleted" : ""}`}>
                              {msg.message}
                              {msg.isEdited && !msg.isDeleted && (
                                <div className="cv-edited-tag">edited</div>
                              )}
                            </div>
                          )}

                          {msg.media && (
                            <>
                              {msg.mediaType === "image" ? (
                                <img
                                  src={`http://localhost:5000/uploads/${msg.media}`}
                                  alt=""
                                  className="cv-media"
                                  onClick={() =>
                                    setPreviewImage(`http://localhost:5000/uploads/${msg.media}`)
                                  }
                                />
                              ) : (
                                <video
                                  src={`http://localhost:5000/uploads/${msg.media}`}
                                  controls
                                  className="cv-media"
                                />
                              )}
                            </>
                          )}

                          <div className="cv-stamp">{formatTime(msg.createdAt)}</div>

                        </div>

                      </div>

                      </React.Fragment>

                    );

                  })}

                

                  <div ref={messagesEndRef}></div>

                </div>

                {replyingTo && (
                  <div className="cv-strip">
                    <div>
                      <span className="cv-strip-label">Replying to {replyingTo.sender?.name}</span>
                      <p>{replyingTo.message}</p>
                    </div>
                    <i className="fa-solid fa-xmark" onClick={() => setReplyingTo(null)}></i>
                  </div>
                )}

                {editingMessage && (
                  <div className="cv-strip">
                    <span className="cv-strip-label">Editing message</span>
                    <i
                      className="fa-solid fa-xmark"
                      onClick={() => {
                        setEditingMessage(null);
                        setMessage("");
                      }}
                    ></i>
                  </div>
                )}

                {media && (
                  <div className="cv-media-stage">
                    {media.type.startsWith("image") ? (
                      <img src={URL.createObjectURL(media)} alt="" />
                    ) : (
                      <video src={URL.createObjectURL(media)} controls />
                    )}
                    <i className="fa-solid fa-xmark cv-media-remove" onClick={() => setMedia(null)}></i>
                  </div>
                )}

                <div className="cv-composer">

                  <div
                    className="cv-attach"
                    onClick={() => document.getElementById("chatMediaInput").click()}
                  >
                    <i className="fa-solid fa-images"></i>
                  </div>

                  <input
                    id="chatMediaInput"
                    type="file"
                    hidden
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                  />

                  <input
                    type="text"
                    placeholder="Write a message…"
                    value={message}
                    onChange={(e) => handleGroupTyping(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />

                  <button className="cv-send" onClick={sendMessage}>
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>

                </div>

              </>

            )}

          </div>

          </div>

        </div>

      </div>

    </div>

    {/* modal for creating group */}

    <div className="modal fade" id="createGroupModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cv-modal-content">

          <div className="modal-header cv-modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-users me-2"></i>
              Create new group
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div className="modal-body">

            <div className="text-center mb-4">

              {groupImage ? (
                <img
                  src={URL.createObjectURL(groupImage)}
                  alt="Group preview"
                  style={{
                    width: "104px",
                    height: "104px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div className="cv-upload-circle">
                  <i className="fa-solid fa-camera"></i>
                </div>
              )}

              <input
                type="file"
                className="form-control mt-3 cv-input"
                accept="image/*"
                onChange={(e) => setGroupImage(e.target.files[0])}
              />
            </div>

            <div className="mb-3">
              <label className="cv-field-label">Group name</label>
              <input
                type="text"
                className="form-control cv-input"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="mb-3">

              <label className="cv-field-label">Add members</label>

              <select
                className="form-select cv-input"
                value=""
                onChange={(e) => {

                  const userId = e.target.value;
                  if (!userId) return;

                  const selectedUserData = allUsers.find((u) => u._id === userId);

                  if (members.some((m) => m._id === userId)) {
                    return toast.error("User already added");
                  }

                  setMembers([...members, selectedUserData]);
                }}
              >
                <option value="">Select user</option>

                {allUsers
                  .filter((user) => !members.some((member) => member._id === user._id))
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
              </select>

            </div>

            <div className="mb-3">
              {members.map((member, index) => (
                <div key={index} className="cv-chip d-flex justify-content-between align-items-center mb-2">
                  <span>{member.name}</span>
                  <i
                    className="fa-solid fa-xmark"
                    onClick={() => setMembers(members.filter((_, i) => i !== index))}
                  ></i>
                </div>
              ))}
            </div>

          </div>

          <div className="modal-footer border-0">
            <button className="cv-btn-ghost" data-bs-dismiss="modal">Cancel</button>
            <button className="cv-btn-primary"onClick={createGroup}>
              Create group
            </button>
          </div>

        </div>
      </div>
    </div>

    {/* join group modal */}

    <div
      className="modal fade"
      id="joinGroupModal"
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cv-modal-content">

          <div className="modal-header cv-modal-header">
            <h5 className="modal-title">
   
              Join a group
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={() => setJoinCode("")}
            ></button>
          </div>

          <div className="modal-body">

        

            <label className="cv-field-label">Invite code</label>

            <div className="cv-join-input-row">
              <input
                type="text"
                className="form-control cv-input cv-join-input"
        
                value={joinCode}
                maxLength={8}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase())
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") joinGroup();
                }}
              />
            </div>

          </div>

          <div className="modal-footer border-0">
            <button
              className="cv-btn-ghost"
              data-bs-dismiss="modal"
              onClick={() => setJoinCode("")}
            >
              Cancel
            </button>

            <button
              className="cv-btn-primary"
              onClick={joinGroup}
              disabled={joiningGroup || joinCode.trim().length < 1}
              data-bs-dismiss={joiningGroup ? "" : "modal"}
            >
              {joiningGroup ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin me-2"></i>
                  Joining…
                </>
              ) : (
                "Join group"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>

    {/* forward message modal */}

    <div className={`modal fade ${showForwardModal ? "show d-block" : ""}`} tabIndex="-1">

      <div className="modal-dialog modal-dialog-centered">

        <div className="modal-content cv-modal-content">

          <div className="modal-header cv-modal-header">
            <h5>Forward message</h5>
            <button
              className="btn-close"
              onClick={() => {
                setShowForwardModal(false);
                setForwardingMsg(null);
                setForwardTargets([]);
              }}
            ></button>
          </div>

          <div className="modal-body">

            {forwardingMsg && (
              <div className="cv-forward-preview">
                {forwardingMsg.message ? (
                  <p>{forwardingMsg.message}</p>
                ) : (
                  <p className="cv-forward-preview-media">
                    <i className="fa-solid fa-paperclip me-2"></i>
                    Media attachment
                  </p>
                )}
              </div>
            )}

            <input
              type="text"
              className="form-control cv-input mb-3"
              placeholder="Search groups or people…"
              value={forwardSearch}
              onChange={(e) => setForwardSearch(e.target.value)}
            />

            <div className="cv-forward-list">

              {groups.length > 0 && (
                <>
                  <div className="cv-forward-section-label">Groups</div>

                  {groups
                    .filter((g) =>
                      g.groupName
                        .toLowerCase()
                        .includes(forwardSearch.toLowerCase())
                    )
                    .map((g) => {
                      const isChecked = forwardTargets.some(
                        (t) => t.type === "group" && t.id === g._id
                      );

                      return (
                        <div
                          key={g._id}
                          className={`cv-forward-row ${isChecked ? "checked" : ""}`}
                          onClick={() => toggleForwardTarget("group", g._id)}
                        >
                          <img
                            src={`http://localhost:5000/uploads/${g.groupImage}`}
                            alt=""
                          />
                          <div className="flex-grow-1">
                            <div className="cv-row-name">{g.groupName}</div>
                            <div className="cv-row-sub">{g.members.length} members</div>
                          </div>
                          <i
                            className={`fa-solid ${
                              isChecked ? "fa-circle-check" : "fa-circle"
                            }`}
                          ></i>
                        </div>
                      );
                    })}
                </>
              )}

              {users.length > 0 && (
                <>
                  <div className="cv-forward-section-label">People</div>

                  {users
                    .filter((u) =>
                      u.name
                        .toLowerCase()
                        .includes(forwardSearch.toLowerCase())
                    )
                    .map((u) => {
                      const isChecked = forwardTargets.some(
                        (t) => t.type === "user" && t.id === u._id
                      );

                      return (
                        <div
                          key={u._id}
                          className={`cv-forward-row ${isChecked ? "checked" : ""}`}
                          onClick={() => toggleForwardTarget("user", u._id)}
                        >
                          <img
                            src={`http://localhost:5000/uploads/${u.image}`}
                            alt=""
                          />
                          <div className="flex-grow-1">
                            <div className="cv-row-name">{u.name}</div>
                            <div className="cv-row-sub">{u.email}</div>
                          </div>
                          <i
                            className={`fa-solid ${
                              isChecked ? "fa-circle-check" : "fa-circle"
                            }`}
                          ></i>
                        </div>
                      );
                    })}
                </>
              )}

              {groups.length === 0 && users.length === 0 && (
                <div className="cv-empty-list">Nothing to forward to yet</div>
              )}

            </div>

          </div>

          <div className="modal-footer border-0">

            <button
              className="cv-btn-ghost"
              onClick={() => {
                setShowForwardModal(false);
                setForwardingMsg(null);
                setForwardTargets([]);
              }}
            >
              Cancel
            </button>

            <button
              className="cv-btn-primary"
              onClick={sendForward}
              disabled={forwarding || forwardTargets.length === 0}
            >
              {forwarding
                ? "Sending…"
                : `Send${forwardTargets.length ? ` (${forwardTargets.length})` : ""}`}
            </button>

          </div>

        </div>

      </div>

    </div>

    {/* add member modal */}

    <div className={`modal fade ${showAddUserModal ? "show d-block" : ""}`} tabIndex="-1">

      <div className="modal-dialog modal-dialog-centered">

        <div className="modal-content cv-modal-content">

          <div className="modal-header cv-modal-header">
            <h5>Add member</h5>
            <button className="btn-close" onClick={() => setShowAddUserModal(false)}></button>
          </div>

          <div className="modal-body">

            <select
              className="form-select cv-input"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select user</option>

              {allUsers
                .filter((u) => !selectedGroup?.members?.some((m) => m._id === u._id))
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
            </select>

          </div>

          <div className="modal-footer border-0">
            <button className="cv-btn-ghost" onClick={() => setShowAddUserModal(false)}>Cancel</button>
            <button
              className="cv-btn-primary"
              onClick={async () => {
                await addUserToGroup();
                setShowAddUserModal(false);
              }}
            >
              Add user
            </button>
          </div>

        </div>

      </div>

    </div>

    {previewImage && (
      <div className="cv-lightbox" onClick={() => setPreviewImage(null)}>
        <div className="cv-lightbox-content" onClick={(e) => e.stopPropagation()}>
          <img src={previewImage} alt="" />
          <div className="cv-lightbox-actions">
            <a href={previewImage} download target="_blank" rel="noreferrer">
              <i className="fa-solid fa-download"></i>
            </a>
            <button onClick={() => setPreviewImage(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </div>
    )}

  </>
  );
};

export default MyGroups;