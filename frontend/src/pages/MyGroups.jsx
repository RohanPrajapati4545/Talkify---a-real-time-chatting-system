import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import socket from "../socket/Socket";
import { useRef } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { logout } from "./../../../frontend/src/pages/redux/AuthSlice";
import SideBar from "./../components/SideBar";
import Loader from "./../components/Loader";
import VoiceMessagePlayer from "./../components/VoiceMessagePlayer";
import CallManager from "./../components/CallManager";
import "./../App.css";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸",
  "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️",
  "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡",
  "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓",
  "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄",
  "😯", "😮", "😲", "🥱", "😴", "🤤", "😪", "🥴", "🤢", "🤮",
  "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👍", "👎",
  "👏", "🙌", "🙏", "👋", "🤝", "💪", "❤️", "🧡", "💛", "💚",
  "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓",
  "💗", "💖", "💘", "💝", "🔥", "✨", "🎉", "🎂", "🎁", "☕",
  "🍕", "🍔", "🍟", "🍎", "⚽", "🏀", "🎮", "📱", "💻", "✅",
  "❌", "⭐",
];

const MyGroups = () => {

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const privateMessagesRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [privateChat, setPrivateChat] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(null);

  const privateChatRef = useRef(null);
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
  // ---- Group messages pagination ----
const [messagesPage, setMessagesPage] = useState(1);
const [hasMoreMessages, setHasMoreMessages] = useState(false);
const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

// ---- Private messages pagination ----
const [privateMessagesPage, setPrivateMessagesPage] = useState(1);
const [hasMorePrivateMessages, setHasMorePrivateMessages] = useState(false);
const [loadingOlderPrivateMessages, setLoadingOlderPrivateMessages] = useState(false);

// ---- call logs (WhatsApp jaisi call entries thread me dikhane ke liye) ----
const [privateCallLogs, setPrivateCallLogs] = useState([]);
const [groupCallLogs, setGroupCallLogs] = useState([]);

// ---- in-chat search (server-side, debounced — Sidebar jaisa pattern) ----
const [debouncedMsgSearchTerm, setDebouncedMsgSearchTerm] = useState("");
const [chatSearchResults, setChatSearchResults] = useState([]);
const [chatSearchPage, setChatSearchPage] = useState(1);
const [chatSearchHasMore, setChatSearchHasMore] = useState(false);
const [chatSearchLoading, setChatSearchLoading] = useState(false);
const chatSearchRequestIdRef = useRef(0);

// scroll position preserve karne ke liye
const messagesScrollAnchorRef = useRef(null);
const privateMessagesScrollAnchorRef = useRef(null);
  const msgMenuRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMsgMenu, setShowMsgMenu] = useState(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

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

  const [groupTypingUsers, setGroupTypingUsers] = useState({});
  const [privateTypingStatus, setPrivateTypingStatus] = useState({});
  const typingTimeoutRef = useRef(null);

  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupImage, setEditGroupImage] = useState(null);
  const [editGroupLoading, setEditGroupLoading] = useState(false);

  const [unreadCounts, setUnreadCounts] = useState({ groups: {}, users: {} });
  const [privateChatMap, setPrivateChatMap] = useState({});


  const [mediaKind, setMediaKind] = useState(null); // "voice" | null

  const [actionLoading, setActionLoading] = useState(false);

  const [sendingMessage, setSendingMessage] = useState(false);

  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearchTerm, setMsgSearchTerm] = useState("");
  const [currentMatchPos, setCurrentMatchPos] = useState(0);
  const messageRefs = useRef({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "m4a";
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
        setMedia(file);
        setMediaKind("voice");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.log(err);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // don't attach file
      mediaRecorderRef.current.stop();
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
    setMedia(null);
    setMediaKind(null);
  };

  const formatRecordingTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    privateChatRef.current = privateChat;
  }, [privateChat]);


const getAllUsers = async () => {
  try {
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/users/all-users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const usersList = res.data.users;

    setAllUsers(usersList);

    const filteredUsers = usersList.filter(
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
        `${process.env.REACT_APP_API_URL}/api/users/blocked-users`,
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

      setActionLoading(true);
      try {
        const url = blocked
          ? `${process.env.REACT_APP_API_URL}/api/users/unblock/${selectedUser._id}`
          : `${process.env.REACT_APP_API_URL}/api/users/block/${selectedUser._id}`;

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
      } finally {
        setActionLoading(false);
      }
    });
  };

  const getPrivateMessages = async (chatId, page = 1, append = false) => {
  if (append) setLoadingOlderPrivateMessages(true);
  else setActionLoading(true);

  try {
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/private/private-messages/${chatId}`,
      {
        params: { page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const newMessages = res.data.messages || [];

    setPrivateMessages((prev) => (append ? [...newMessages, ...prev] : newMessages));
    setHasMorePrivateMessages(Boolean(res.data.pagination?.hasMore));
    setPrivateMessagesPage(page);
  } finally {
    setLoadingOlderPrivateMessages(false);
    setActionLoading(false);
  }
};

// 👇 NAYA — is private chat ke saare call logs fetch karo
const getPrivateCallLogs = async (chatId) => {
  try {
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/private/call-logs/${chatId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setPrivateCallLogs(res.data.calls || []);
  } catch (error) {
    console.log(error);
    setPrivateCallLogs([]);
  }
};


const getGroupCallLogs = async (groupId) => {
  try {
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/user/call-logs/${groupId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setGroupCallLogs(res.data.calls || []);
  } catch (error) {
    console.log(error);
    setGroupCallLogs([]);
  }
};

const handleLoadOlderPrivateMessages = () => {
  if (loadingOlderPrivateMessages || !hasMorePrivateMessages) return;

  const container = privateMessagesRef.current;
  if (container) {
    privateMessagesScrollAnchorRef.current = {
      prevScrollHeight: container.scrollHeight,
      prevScrollTop: container.scrollTop,
    };
  }

  getPrivateMessages(privateChat._id, privateMessagesPage + 1, true);
};
useEffect(() => {
  if (privateChat?._id) {
    setPrivateMessagesPage(1);
    setHasMorePrivateMessages(false);
    getPrivateMessages(privateChat._id, 1, false);
    getPrivateCallLogs(privateChat._id); // 👈 NAYA
  } else {
    setPrivateCallLogs([]);
  }
}, [privateChat]);

  const getMyPrivateChats = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/private/my-chats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 👇 FIX — backend `{ chats, pagination }` object bhejta hai, seedha
      // array nahi. Pehle `res.data.forEach` use ho raha tha jo har baar
      // silently fail ho raha tha (res.data ek object hai, array nahi),
      // isliye `privateChatMap` kabhi populate hi nahi hota tha — isi
      // wajah se SideBar ke Calls tab me private call logs kabhi fetch
      // nahi ho paa rahe the (sirf group calls dikh rahe the).
      const chats = res.data?.chats || [];

      const map = {};
      const activityMap = {};

      chats.forEach((chat) => {
        const other = chat.members.find((m) => m._id !== user._id);
        if (other) {
          map[other._id] = chat._id;
          socket.emit("joinPrivateChat", chat._id);

          activityMap[other._id] = new Date(
            chat.updatedAt || chat.createdAt || 0
          ).getTime();
        }
      });

      setPrivateChatMap(map);
      setUserLastActivity((prev) => ({ ...activityMap, ...prev }));

    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (user?._id) {
      getMyPrivateChats();
    }
  }, [user?._id]);

  const getUnreadCounts = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/private/unread-counts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUnreadCounts((prev) => ({
        ...prev,
        users: { ...prev.users, ...res.data },
      }));

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user?._id) {
      getUnreadCounts();
    }
  }, [user?._id]);

  useEffect(() => {
    groups.forEach((g) => {
      socket.emit("joinGroup", g._id);
    });
  }, [groups]);

  const openPrivateChat = async (user) => {
    setShowUserInfo(false);
    setShowMedia(false);
    setPreviewImage(null);
    setShowEmojiPicker(false);
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/private/open-chat`,
        { userId: user._id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setShowUserInfo(false);
      setSelectedUser(user);
      setSelectedGroup(null);

      setPrivateChat(res.data);
      await getPrivateMessages(res.data._id);

      socket.emit(
        "joinPrivateChat",
        res.data._id
      );

      setUnreadCounts((prev) => ({
        ...prev,
        users: { ...prev.users, [user._id]: 0 },
      }));

    } catch (err) {
      console.log(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openGroupChat = (group) => {
    setShowGroupInfo(false);
    setShowMedia(false);
    setPreviewImage(null);
    setShowEmojiPicker(false);
    setSelectedGroup(group);
    setSelectedUser(null);

    setUnreadCounts((prev) => ({
      ...prev,
      groups: { ...prev.groups, [group._id]: 0 },
    }));
  };

  useEffect(() => {

    socket.on(
      "receivePrivateMessage",
      (msg) => {

        const isMine = (msg.sender?._id || msg.sender) === user?._id;

        const otherId =
          isMine
            ? msg.receiver?._id || msg.receiver
            : msg.sender?._id || msg.sender;

        const chatIsOpen =
          privateChatRef.current &&
          msg.chatId &&
          msg.chatId.toString() === privateChatRef.current._id?.toString();

        if (chatIsOpen) {
          setPrivateMessages(prev => [
            ...prev,
            msg
          ]);
        }

        if (otherId) {
          setUserLastActivity((prev) => ({ ...prev, [otherId]: Date.now() }));
        }

        const isReceiver =
          msg.receiver?._id === user?._id || msg.receiver === user?._id;

        if (otherId && !isMine && !chatIsOpen) {
          setUnreadCounts((prev) => ({
            ...prev,
            users: {
              ...prev.users,
              [otherId]: (prev.users[otherId] || 0) + 1,
            },
          }));
        }

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

  // 👇 NAYA — jab bhi koi private call log ho (khatam/reject/missed), server
  // se real-time event aata hai. Agar yeh usi chat ka hai jo abhi open hai
  // toh turant list me daal do, aur sidebar ki activity bhi update kar do.
  useEffect(() => {
    socket.on("callLogAdded", (call) => {
      const isOpenChat =
        privateChatRef.current &&
        call.chatId &&
        call.chatId.toString() === privateChatRef.current._id?.toString();

      if (isOpenChat) {
        setPrivateCallLogs((prev) =>
          prev.some((c) => c._id === call._id) ? prev : [...prev, call]
        );
      }

      const callerId = call.caller?._id || call.caller;
      const receiverId = call.receiver?._id || call.receiver;
      const otherId = callerId === user?._id ? receiverId : callerId;

      if (otherId) {
        setUserLastActivity((prev) => ({ ...prev, [otherId]: Date.now() }));
      }
    });

    return () => {
      socket.off("callLogAdded");
    };
  }, [user?._id]);

  useEffect(() => {
    socket.on("privateChatDeleted", ({ chatId }) => {
      if (privateChat?._id === chatId) {
        setPrivateMessages([]);
        setPrivateCallLogs([]);
        setPrivateChat(null);
        setSelectedUser(null);
        setShowUserInfo(false);
      }
    });

    return () => {
      socket.off("privateChatDeleted");
    };
  }, [privateChat]);

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
const fetchChatSearchResults = useCallback(
  async (term, page, append = false) => {
    const currentRequestId = ++chatSearchRequestIdRef.current;
    const isGroup = Boolean(selectedGroup);
    const id = isGroup ? selectedGroup?._id : privateChat?._id;
    if (!id) return;

    const url = isGroup
      ? `${process.env.REACT_APP_API_URL}/api/user/messages/${id}`
      : `${process.env.REACT_APP_API_URL}/api/private/private-messages/${id}`;

    setChatSearchLoading(true);
    try {
      const res = await axios.get(url, {
        params: { search: term, page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (currentRequestId !== chatSearchRequestIdRef.current) return;

      const items = res.data.messages || [];
      setChatSearchResults((prev) => (append ? [...prev, ...items] : items));
      setChatSearchHasMore(Boolean(res.data.pagination?.hasMore));
      setChatSearchPage(page);
    } catch (err) {
      console.log(err);
      if (!append) setChatSearchResults([]);
      setChatSearchHasMore(false);
    } finally {
      setChatSearchLoading(false);
    }
  },
  [selectedGroup, privateChat, token]
);

useEffect(() => {
  if (!debouncedMsgSearchTerm) {
    setChatSearchResults([]);
    setChatSearchHasMore(false);
    setChatSearchPage(1);
    return;
  }
  fetchChatSearchResults(debouncedMsgSearchTerm, 1, false);
}, [debouncedMsgSearchTerm, fetchChatSearchResults]);

const handleChatSearchLoadMore = () => {
  if (chatSearchLoading || !chatSearchHasMore) return;
  fetchChatSearchResults(debouncedMsgSearchTerm, chatSearchPage + 1, true);
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
      let forwardIsVoice = false;

      if (forwardingMsg.media) {
        const mediaRes = await fetch(forwardingMsg.media);
        const blob = await mediaRes.blob();
        mediaFile = new File([blob], forwardingMsg.media, {
          type: blob.type,
        });
        forwardIsVoice = forwardingMsg.mediaType === "audio";
      }

      for (const target of forwardTargets) {

        const formData = new FormData();

        if (forwardingMsg.message) {
          formData.append("message", forwardingMsg.message);
        }

        if (mediaFile) {
          formData.append("media", mediaFile);
          if (forwardIsVoice) {
            formData.append("isVoice", "true");
          }
        }

        if (target.type === "group") {

          formData.append("groupId", target.id);

          const res = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/user/send-message`,
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
            `${process.env.REACT_APP_API_URL}/api/private/open-chat`,
            { userId: target.id },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          formData.append("chatId", chatRes.data._id);
          formData.append("receiverId", target.id);

          const res = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/private/send-private-message`,
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
        `Forwarded to ${forwardTargets.length} ${forwardTargets.length === 1 ? "chat" : "chats"
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

  const appendEmoji = (emoji) => {
    const newText = message + emoji;
    if (selectedUser) {
      handlePrivateTyping(newText);
    } else {
      handleGroupTyping(newText);
    }
  };

  const MAX_MEDIA_SIZE = 10 * 1024 * 1024;

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > MAX_MEDIA_SIZE) {
      toast.error("File too large. Please select a file under 10 MB");
      e.target.value = "";
      setMedia(null);
      setMediaKind(null);
      return;
    }

    setMedia(file);
    setMediaKind(null); // file-picker se aaya hai, voice nahi
  };
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState("");
const addUserToGroup = async () => {
  if (!selectedMemberToAdd) {
    return toast.error("Please select a user");
  }

  setActionLoading(true);
  try {
    const res = await axios.put(
      `${process.env.REACT_APP_API_URL}/api/users/add-user`,
      {
        groupId: selectedGroup._id,
        userId: selectedMemberToAdd,   // ← fix
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast.success(res.data.message);

    setSelectedGroup(res.data.group);

    setGroups((prev) =>
      prev.map((group) =>
        group._id === res.data.group._id
          ? res.data.group
          : group
      )
    );

    setSelectedMemberToAdd("");   // ← fix

  } catch (error) {
    toast.error(
      error.response?.data
        ?.message ||
      "Something went wrong"
    );
  } finally {
    setActionLoading(false);
  }
};
  const deleteMessage = async (id) => {

    const res = await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/private/delete-message/${id}`,
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
  const callLockRef = useRef(false);

  const triggerCall = (targetUser, type) => {
    if (callLockRef.current) return;
    callLockRef.current = true;
    window.__startCall?.(targetUser, type);
    setTimeout(() => { callLockRef.current = false; }, 2000); // 2s cooldown
  };
  const deleteGroupMessage = async (id) => {

    const res = await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/user/delete-message/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setMessages(prev =>
      prev.map(m =>
        m._id === id
          ? res.data
          : m
      )
    );

    setShowMsgMenu(null);
  };

  const triggerGroupCall = (group, type) => {
    if (callLockRef.current) return;
    callLockRef.current = true;
    window.__startGroupCall?.(group, type);
    setTimeout(() => { callLockRef.current = false; }, 2000);
  };

  const updateGroupMessage = (msg) => {

    setEditingMessage(msg);

    setMessage(msg.message);

    setShowMsgMenu(null);

  };

 
const handleLeaveGroup = () => {
  if (!selectedGroup) return;

  const isAdmin = selectedGroup?.createdBy?._id === user?._id;
  const onlyMemberLeft = selectedGroup?.members?.length === 1;

  Swal.fire({
    title: "Leave Group?",
    text: isAdmin
      ? onlyMemberLeft
        ? "You're the only member. Leaving will delete this group permanently."
        : "You're the admin. The next member in the group will automatically become the new admin."
      : "You will no longer receive messages from this group.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, leave",
    confirmButtonColor: "#dc3545",
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/leave-group`,
        { groupId: selectedGroup._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // remove the group from the sidebar list either way (left it, or it
      // got deleted because we were the last member)
      setGroups((prev) => prev.filter((g) => g._id !== selectedGroup._id));

      setSelectedGroup(null);
      setShowGroupInfo(false);
      setMessages([]);

      toast.success(res.data.message || "You left the group");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Could not leave group");
    }
  });
};
const selectedGroupRef = useRef(null);

useEffect(() => {
  selectedGroupRef.current = selectedGroup;
}, [selectedGroup]);
useEffect(() => {
  socket.on("groupMemberLeft", ({ groupId, userId, newCreatedBy, group }) => {
    // update the group's members/admin everywhere it's referenced
    setGroups((prev) =>
      prev.map((g) => (g._id === groupId ? { ...g, ...group } : g))
    );

    setSelectedGroup((prev) =>
      prev && prev._id === groupId ? { ...prev, ...group } : prev
    );

    // if I'm the one who was just promoted to admin, let me know
    if (newCreatedBy?._id === user?._id && userId !== user?._id) {
      toast.info("You are now the admin of this group");
    }
  });

  socket.on("groupDeleted", ({ groupId }) => {
    setGroups((prev) => prev.filter((g) => g._id !== groupId));

    if (selectedGroupRef.current?._id === groupId) {
      setSelectedGroup(null);
      setShowGroupInfo(false);
      setMessages([]);
      toast.info("This group was deleted");
    }
  });

  return () => {
    socket.off("groupMemberLeft");
    socket.off("groupDeleted");
  };
}, [user?._id]);
  const deleteChat = async () => {
    setActionLoading(true);
    try {
      const res = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/private/delete-chat/${privateChat._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(res.data.message);

      setUserLastActivity((prev) => {
        const copy = { ...prev };
        delete copy[selectedUser._id];
        return copy;
      });

      setPrivateMessages([]);
      setPrivateCallLogs([]);
      setPrivateChat(null);
      setSelectedUser(null);
      setShowUserInfo(false);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not delete chat"
      );
    } finally {
      setActionLoading(false);
    }
  };
useEffect(() => {
  const handleGroupCreated = ({ group }) => {
    setGroups((prev) => (prev.some((g) => g._id === group._id) ? prev : [group, ...prev]));
    socket.emit("joinGroup", group._id);

    setGroupLastActivity((prev) => ({
      ...prev,
      [group._id]: new Date(group.updatedAt || group.createdAt || Date.now()).getTime(),
    }));

    toast.info(`You were added to "${group.groupName}"`);
  };

  const handleGroupMembersUpdated = ({ groupId, group }) => {
    setGroups((prev) => {
      const exists = prev.some((g) => g._id === groupId);
      if (exists) {
        return prev.map((g) => (g._id === groupId ? { ...g, ...group } : g));
      }
      return [group, ...prev];
    });

    // in case I'm the one who was just added/joined and hadn't joined
    // this group's socket room yet
    socket.emit("joinGroup", groupId);

    setSelectedGroup((prev) =>
      prev && prev._id === groupId ? { ...prev, ...group } : prev
    );
  };

  socket.on("groupCreated", handleGroupCreated);
  socket.on("groupMembersUpdated", handleGroupMembersUpdated);

  return () => {
    socket.off("groupCreated", handleGroupCreated);
    socket.off("groupMembersUpdated", handleGroupMembersUpdated);
  };
}, []);
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

      setActionLoading(true);
      try {
        const res = await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/user/clear-group-chat/${selectedGroup._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages([]);
        toast.success(res.data.message);

      } catch (error) {
        toast.error(error.response?.data?.message || "Could not clear chat");
      } finally {
        setActionLoading(false);
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
    setActionLoading(true);
    try {

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/remove-member`,
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

    } finally {
      setActionLoading(false);
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
    setActionLoading(true);
    try {
      const res = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/user/delete-group/${selectedGroup._id}`,
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
    } finally {
      setActionLoading(false);
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
const [sidebarRefreshSignal, setSidebarRefreshSignal] = useState(0);
  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const createGroup = async () => {

    if (!groupName || !groupImage) {
      return toast.error("All fields are required")
    }
    if (members.length === 0) {
      return toast.error(
        "Please select at least one member"
      );
    }

    setCreatingGroup(true);

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
      if (groupImage) {
        formData.append("groupImage", groupImage);
      }

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/create-group`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      getMyGroups()
      setSidebarRefreshSignal((n) => n + 1);
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
    } finally {
      setCreatingGroup(false);
    }
  };
  const joinGroup = async () => {
    if (!joinCode.trim()) {
      return toast.error("Please enter an invite code");
    }

    setJoiningGroup(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/join-group`,
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
          `${process.env.REACT_APP_API_URL}/api/user/regenerate-code/${selectedGroup._id}`,
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
        `${process.env.REACT_APP_API_URL}/api/user/update-group/${selectedGroup._id}`,
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
        `${process.env.REACT_APP_API_URL}/api/user/get-my-group`,
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
const getMessages = async (page = 1, append = false) => {
  try {
    if (!selectedGroup) return;

    if (append) setLoadingOlderMessages(true);
    else setActionLoading(true);

    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/user/messages/${selectedGroup._id}`,
      {
        params: { page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const newMessages = res.data.messages || [];

    setMessages((prev) => (append ? [...newMessages, ...prev] : newMessages));
    setHasMoreMessages(Boolean(res.data.pagination?.hasMore));
    setMessagesPage(page);
  } catch (error) {
    console.log(error);
  } finally {
    setLoadingOlderMessages(false);
    setActionLoading(false);
  }
};

const handleLoadOlderMessages = () => {
  if (loadingOlderMessages || !hasMoreMessages) return;

  // scroll position note kar lo taaki purane messages upar add hone par
  // view "jump" na kare — user jahan dekh raha tha wahi rahega
  const container = messagesContainerRef.current;
  if (container) {
    messagesScrollAnchorRef.current = {
      prevScrollHeight: container.scrollHeight,
      prevScrollTop: container.scrollTop,
    };
  }

  getMessages(messagesPage + 1, true);
};

  const sendMessage = async () => {

    if (sendingMessage) return;

    if (editingMessage) {

      setSendingMessage(true);
      try {
        const res = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/user/update-message/${editingMessage._id}`,
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
      } catch (error) {
        console.log(error);
        toast.error("Could not update message");
      } finally {
        setSendingMessage(false);
      }

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
      console.log("media =", media);
      console.log("mediaKind =", mediaKind);
      if (mediaKind === "voice") {

        formData.append("isVoice", "true");
      }
    }

    setSendingMessage(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/send-message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("sendMessage", res.data);

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
      setMediaKind(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.log(error);
      toast.error("Message failed");
    } finally {
      setSendingMessage(false);
    }
  };

  const sendPrivateMessage = async () => {

    if (sendingMessage) return;

    if (editingMessage) {

      setSendingMessage(true);
      try {
        const res = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/private/update-message/${editingMessage._id}`,
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
      } catch (error) {
        console.log(error);
        toast.error("Could not update message");
      } finally {
        setSendingMessage(false);
      }

      return;
    }

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
      console.log("media =", media);
      console.log("mediaKind =", mediaKind);
      if (mediaKind === "voice") {
        formData.append("isVoice", "true");
      }
    }

    setSendingMessage(true);
    try {

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/private/send-private-message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      socket.emit("sendPrivateMessage", res.data);

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
      setMediaKind(null);
      setShowEmojiPicker(false);

    } catch (error) {
      console.log(error);
      toast.error("Private message failed");
    } finally {
      setSendingMessage(false);
    }
  };
  const handleSend = () => {

    if (sendingMessage) return;

    if (selectedUser) {
      if (isUserBlocked(selectedUser._id)) {
        return toast.error("Unblock this user to send a message");
      }
      sendPrivateMessage();
    } else {
      sendMessage();
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
  }, [user?._id]);

  useEffect(() => {
    getMyGroups();
  }, []);
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      const gId = msg.group?._id || msg.group || msg.groupId;
      const isMine = (msg.sender?._id || msg.sender) === user?._id;

      if (selectedGroup?._id === gId) {
        setMessages((prev) => [...prev, msg]);
      }

      if (gId) {
        setGroupLastActivity((prev) => ({ ...prev, [gId]: Date.now() }));

        if (!isMine && selectedGroup?._id !== gId) {
          setUnreadCounts((prev) => ({
            ...prev,
            groups: {
              ...prev.groups,
              [gId]: (prev.groups[gId] || 0) + 1,
            },
          }));
        }
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [selectedGroup, user?._id]);

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

  // 👇 NAYA — group call ka log real-time aane par, agar yahi group open hai
  // toh usi thread me daal do
  useEffect(() => {
    socket.on("groupCallLogAdded", (call) => {
      const gId = call.group?._id || call.group;
      if (selectedGroupRef.current?._id === gId) {
        setGroupCallLogs((prev) =>
          prev.some((c) => c._id === call._id) ? prev : [...prev, call]
        );
      }
      if (gId) {
        setGroupLastActivity((prev) => ({ ...prev, [gId]: Date.now() }));
      }
    });

    return () => {
      socket.off("groupCallLogAdded");
    };
  }, []);

  useEffect(() => {
  if (selectedGroup) {
    socket.emit("joinGroup", selectedGroup._id);
    setMessagesPage(1);
    setHasMoreMessages(false);
    getMessages(1, false);
    getGroupCallLogs(selectedGroup._id); // 👈 NAYA
  } else {
    setGroupCallLogs([]);
  }
}, [selectedGroup]);
 useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  if (messagesScrollAnchorRef.current) {
    // purane messages upar add hue — scroll position preserve karo
    const { prevScrollHeight, prevScrollTop } = messagesScrollAnchorRef.current;
    container.scrollTop = container.scrollHeight - prevScrollHeight + prevScrollTop;
    messagesScrollAnchorRef.current = null;
  } else {
    // naya message aaya ya group switch hua — bottom pe le jao
    container.scrollTop = container.scrollHeight;
  }
}, [messages, selectedGroup, groupCallLogs]);

 useEffect(() => {
  const container = privateMessagesRef.current;
  if (!container) return;

  if (privateMessagesScrollAnchorRef.current) {
    const { prevScrollHeight, prevScrollTop } = privateMessagesScrollAnchorRef.current;
    container.scrollTop = container.scrollHeight - prevScrollHeight + prevScrollTop;
    privateMessagesScrollAnchorRef.current = null;
  } else {
    container.scrollTop = container.scrollHeight;
  }
}, [privateMessages, selectedUser, privateCallLogs]);
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
        setActionLoading(true);
        if (user?._id) {
          socket.emit("userOffline", user._id);
        }
        dispatch(logout());
        navigate("/");
        setActionLoading(false);
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

  useEffect(() => {
    const handleOutsideEmojiClick = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideEmojiClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideEmojiClick
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
    setShowEmojiPicker(false);
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

  // 👇 NAYA — messages + call-logs ko ek hi timeline me merge karte hain
  // taaki thread me WhatsApp jaisa call entry sahi jagah (uske time ke
  // hisaab se) dikhe. Har item me `_kind: "message" | "call"` flag hai.
  const mergedPrivateThread = useMemo(() => {
    const msgItems = privateMessages.map((m) => ({ _kind: "message", data: m, createdAt: m.createdAt }));
    const callItems = privateCallLogs.map((c) => ({ _kind: "call", data: c, createdAt: c.createdAt }));
    return [...msgItems, ...callItems].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [privateMessages, privateCallLogs]);

  const mergedGroupThread = useMemo(() => {
    const msgItems = messages.map((m) => ({ _kind: "message", data: m, createdAt: m.createdAt }));
    const callItems = groupCallLogs.map((c) => ({ _kind: "call", data: c, createdAt: c.createdAt }));
    return [...msgItems, ...callItems].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [messages, groupCallLogs]);

  // 👇 NAYA — ek private call-log entry render karta hai (WhatsApp jaisi
  // centered pill: incoming/outgoing, call type icon, duration ya missed/declined)
  const renderPrivateCallLog = (call) => {
    const callerId = call.caller?._id || call.caller;
    const isOutgoing = callerId === user?._id;

    const icon = call.callType === "video" ? "fa-video" : "fa-phone";

    let label;
    if (call.status === "missed") {
      label = isOutgoing ? "No answer" : "Missed call";
    } else if (call.status === "rejected") {
      label = isOutgoing ? "Call declined" : "You declined";
    } else {
      const m = String(Math.floor((call.duration || 0) / 60)).padStart(2, "0");
      const s = String((call.duration || 0) % 60).padStart(2, "0");
      label = `${m}:${s}`;
    }

    const isMissedLike = call.status === "missed" || call.status === "rejected";

    return (
      <div key={call._id} className="cv-call-log-row">
        <div className={`cv-call-log-pill ${isMissedLike ? "missed" : ""}`}>
          <i className={`fa-solid ${icon}`}></i>
          <span className="cv-call-log-dir">
            {isOutgoing ? "Outgoing" : "Incoming"} {call.callType} call
          </span>
          <span className="cv-call-log-meta">
            {label} · {formatTime(call.createdAt)}
          </span>
        </div>
      </div>
    );
  };


  const renderGroupCallLog = (call) => {
    const icon = call.callType === "video" ? "fa-video" : "fa-phone";
    const m = String(Math.floor((call.duration || 0) / 60)).padStart(2, "0");
    const s = String((call.duration || 0) % 60).padStart(2, "0");

    return (
      <div key={call._id} className="cv-call-log-row">
        <div className="cv-call-log-pill">
          <i className={`fa-solid ${icon}`}></i>
          <span className="cv-call-log-dir">
            {call.caller?.name || "Someone"} started a {call.callType} call
          </span>
          <span className="cv-call-log-meta">
            {m}:{s} · {formatTime(call.createdAt)}
          </span>
        </div>
      </div>
    );
  };

  const activeThreadMessages = selectedUser ? privateMessages : messages;

  const escapeRegExp = (str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const msgSearchMatches = useMemo(() => {
    const term = msgSearchTerm.trim().toLowerCase();
    if (!term) return [];
    return activeThreadMessages
      .filter(
        (m) =>
          !m.isDeleted &&
          m.message &&
          m.message.toLowerCase().includes(term)
      )
      .map((m) => m._id);
  }, [activeThreadMessages, msgSearchTerm]);

  useEffect(() => {
    setCurrentMatchPos(0);
  }, [msgSearchTerm]);

  useEffect(() => {
    setShowMsgSearch(false);
    setMsgSearchTerm("");
    setCurrentMatchPos(0);
    messageRefs.current = {};
  }, [selectedGroup?._id, selectedUser?._id]);
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedMsgSearchTerm(msgSearchTerm.trim());
  }, 500);
  return () => clearTimeout(timer);
}, [msgSearchTerm]);

  useEffect(() => {
    if (msgSearchMatches.length === 0) return;
    const safeIndex = Math.min(currentMatchPos, msgSearchMatches.length - 1);
    const id = msgSearchMatches[safeIndex];
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentMatchPos, msgSearchMatches]);

  const goToNextMatch = () => {
    if (msgSearchMatches.length === 0) return;
    setCurrentMatchPos((prev) => (prev + 1) % msgSearchMatches.length);
  };

  const goToPrevMatch = () => {
    if (msgSearchMatches.length === 0) return;
    setCurrentMatchPos(
      (prev) => (prev - 1 + msgSearchMatches.length) % msgSearchMatches.length
    );
  };

  const highlightText = (text, msgId) => {
    const term = msgSearchTerm.trim();
    if (!term || !text) return text;

    const lowerTerm = term.toLowerCase();
    const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
    const parts = text.split(regex);
    const isActive = msgSearchMatches[currentMatchPos] === msgId;

    return parts.map((part, i) =>
      part.toLowerCase() === lowerTerm ? (
        <mark
          key={i}
          style={{
            background: isActive ? "var(--amber)" : "var(--amber-soft)",
            color: isActive ? "var(--ink)" : "inherit",
            borderRadius: "3px",
            padding: "0 1px",
          }}
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  const renderMsgSearchBar = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 18px",
        borderBottom: "1px solid var(--hairline)",
        background: "var(--panel-2)",
      }}
    >
      <i
        className="fa-solid fa-magnifying-glass"
        style={{ color: "var(--muted)", fontSize: "13px" }}
      ></i>

      <input
        type="text"
        autoFocus
        placeholder="Search in this chat…"
        value={msgSearchTerm}
     onChange={(e) => setMsgSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.shiftKey ? goToPrevMatch() : goToNextMatch();
          }
          if (e.key === "Escape") {
            setShowMsgSearch(false);
            setMsgSearchTerm("");
          }
        }}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--paper)",
          fontSize: "13px",
          fontFamily: "var(--font-body)",
        }}
      />

      {msgSearchTerm && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--muted)",
            whiteSpace: "nowrap",
          }}
        >
          {msgSearchMatches.length > 0
            ? `${currentMatchPos + 1}/${msgSearchMatches.length}`
            : "0/0"}
        </span>
      )}

      <i
        className="fa-solid fa-chevron-up"
        onClick={goToPrevMatch}
        title="Previous match"
        style={{ color: "var(--muted)", fontSize: "12px", cursor: "pointer" }}
      ></i>

      <i
        className="fa-solid fa-chevron-down"
        onClick={goToNextMatch}
        title="Next match"
        style={{ color: "var(--muted)", fontSize: "12px", cursor: "pointer" }}
      ></i>

      <i
        className="fa-solid fa-xmark"
        onClick={() => {
          setShowMsgSearch(false);
          setMsgSearchTerm("");
        }}
        title="Close search"
        style={{ color: "var(--muted)", fontSize: "14px", cursor: "pointer" }}
      ></i>
    </div>
  );

  const currentGroupTypingNames = selectedGroup
    ? Object.values(groupTypingUsers[selectedGroup._id] || {})
    : [];

  const isPrivateUserTyping = Boolean(
    selectedUser && privateTypingStatus[selectedUser._id]
  );
  useEffect(() => {
    const vv = window.visualViewport;

    const setVH = () => {
      const height = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
    };

    setVH();

    vv?.addEventListener("resize", setVH);
    window.addEventListener("resize", setVH);

    return () => {
      vv?.removeEventListener("resize", setVH);
      window.removeEventListener("resize", setVH);
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("cv-chat-active");
    return () => document.body.classList.remove("cv-chat-active");
  }, []);
  return (<>

    {actionLoading && <Loader />}
    <CallManager user={user} />
    <div className="  cv-page-container">

      <div className="cv-shell">

        <div className="row g-0 cv-grid">

          <div
            className={`col-12 col-md-4 p-0 ${chatOpen ? "d-none d-md-block" : "d-block"
              }`}
          >
          <SideBar
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  setSelectedGroup={setSelectedGroup}
  setSelectedUser={setSelectedUser}
  openPrivateChat={openPrivateChat}
  onSelectGroup={openGroupChat}
  unreadCounts={unreadCounts}
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
  userLastActivity={userLastActivity}
  groupLastActivity={groupLastActivity}
  refreshSignal={sidebarRefreshSignal}
   groups={groups}                 /* 👈 NAYA */
  privateChatMap={privateChatMap} /* 👈 NAYA */
  allUsers={allUsers} 
/>
          </div>

          <div
            className={`col-12 col-md-8 p-0 ${chatOpen ? "d-block" : "d-none d-md-block"
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
                          src={selectedUser.image}
                          className="cv-info-avatar"
                          alt=""
                          onClick={() =>
                            setPreviewImage(selectedUser.image)
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
                            className={`fa-solid ${isUserBlocked(selectedUser._id) ? "fa-circle-check" : "fa-ban"
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
                                      src={msg.media}
                                      alt=""
                                      onClick={() =>
                                        setPreviewImage(msg.media)
                                      }
                                    />

                                  ) : msg.mediaType === "audio" ? (

                                    <VoiceMessagePlayer src={msg.media} isMine={msg.sender?._id === user?._id} />

                                  ) : (

                                    <video
                                      controls
                                      src={msg.media}
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

                
                    <div className="cv-thread-header">

                      <div className="cv-thread-id" onClick={() => setShowUserInfo(true)}>

                        <i
                          className="fa-solid fa-arrow-left d-md-none cv-back-btn"
                          onClick={goBackToList}
                        ></i>

                        <div className="cv-avatar-wrap"   >
                          <img
                            src={selectedUser.image}
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
                        <i
                          className="fa-solid fa-magnifying-glass"
                          onClick={() => setShowMsgSearch((prev) => !prev)}
                          title="Search messages"
                        ></i>
                        <i className="fa-solid fa-phone" onClick={() => triggerCall(selectedUser, "audio")}></i>
                        <i className="fa-solid fa-video" onClick={() => triggerCall(selectedUser, "video")}></i>
                        <i
                          className="fa-solid fa-circle-info"
                          onClick={() => setShowUserInfo(true)}
                        ></i>
                      </div>

                    </div>

               
                    {showMsgSearch && renderMsgSearchBar()}

         
                  <div className="cv-thread" ref={privateMessagesRef}>

  {hasMorePrivateMessages && (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <button
        type="button"
        className="cv-load-more-btn"
        onClick={handleLoadOlderPrivateMessages}
        disabled={loadingOlderPrivateMessages}
      >
        {loadingOlderPrivateMessages ? "Loading..." : "Load older messages"}
      </button>
    </div>
  )}

  {mergedPrivateThread.length === 0 ? (
                        <div className="cv-thread-empty">
                          No messages yet — start the conversation
                        </div>
                      ) : (
                        mergedPrivateThread.map((item, index) => {

                          if (item._kind === "call") {
                            return renderPrivateCallLog(item.data);
                          }

                          const msg = item.data;
                          const isMe = msg.sender?._id === user?._id;
                          const side = isMe ? "mine" : "theirs";

                          // date separator ke liye pichla MESSAGE dhoondo
                          // (call-log items ko count nahi karte)
                          let prevMsg = null;
                          for (let i = index - 1; i >= 0; i--) {
                            if (mergedPrivateThread[i]._kind === "message") {
                              prevMsg = mergedPrivateThread[i].data;
                              break;
                            }
                          }
                          const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);

                          return (
                            <React.Fragment key={msg._id}>

                              {showDateSeparator && (
                                <div className="cv-date-separator">
                                  <span>{getDateLabel(msg.createdAt)}</span>
                                </div>
                              )}

                              <div
                                className={`cv-msg-row ${side}`}
                                ref={(el) => (messageRefs.current[msg._id] = el)}
                              >

                                {!isMe && (
                                  <div className="cv-bubble-avatar-wrap">
                                    <img
                                      src={msg.sender?.image}
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
                                      {msg.isDeleted ? msg.message : highlightText(msg.message, msg._id)}
                                      {msg.isEdited && !msg.isDeleted && (
                                        <div className="cv-edited-tag">edited</div>
                                      )}
                                    </div>
                                  )}

                                  {msg.media && (
                                    <>
                                      {msg.mediaType === "image" ? (
                                        <img
                                          src={msg.media}
                                          className="cv-media"
                                          alt=""
                                          onClick={() => setPreviewImage(msg.media)}
                                        />
                                      ) : msg.mediaType === "audio" ? (
                                        <VoiceMessagePlayer src={msg.media} isMine={isMe} />
                                      ) : (
                                        <video
                                          src={msg.media}
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
                                        className={`fa-solid ${msg.seen
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
                        ) : media.type.startsWith("audio") ? (
                          <audio controls src={URL.createObjectURL(media)} />
                        ) : (
                          <video src={URL.createObjectURL(media)} controls />
                        )}
                        <i className="fa-solid fa-xmark cv-media-remove" onClick={() => { setMedia(null); setMediaKind(null); }}></i>
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

                        <div
                          ref={emojiPickerRef}
                          style={{ position: "relative", display: "flex", alignItems: "center" }}
                        >
                          <div
                            className="cv-attach"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                          >
                            <i className="fa-solid fa-face-smile"></i>
                          </div>

                          {showEmojiPicker && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: "48px",
                                left: 0,
                                width: "260px",
                                maxHeight: "220px",
                                overflowY: "auto",
                                background: "#fff",
                                border: "1px solid #e0e0e0",
                                borderRadius: "10px",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                                padding: "8px",
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                gap: "4px",
                                zIndex: 20,
                              }}
                            >
                              {EMOJI_LIST.map((emoji, i) => (
                                <span
                                  key={i}
                                  onClick={() => appendEmoji(emoji)}
                                  style={{
                                    fontSize: "20px",
                                    cursor: "pointer",
                                    textAlign: "center",
                                    lineHeight: "28px",
                                    borderRadius: "6px",
                                  }}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="Write a message…"
                          value={message}
                          onChange={(e) => handlePrivateTyping(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                          }}
                        />

                        <button
                          type="button"
                          className="cv-send"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={
                            sendingMessage
                              ? undefined
                              : message.trim() || media
                                ? handleSend
                                : isRecording
                                  ? stopRecording
                                  : startRecording
                          }
                          disabled={sendingMessage}
                        >
                          {sendingMessage ? (
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                          ) : message.trim() || media ? (
                            <i className="fa-solid fa-paper-plane"></i>
                          ) : isRecording ? (
                            <i className="fa-solid fa-stop" style={{ color: "red" }}></i>
                          ) : (
                            <i className="fa-solid fa-microphone"></i>
                          )}
                        </button>
                        {isRecording && (
                          <div className="cv-recording-bar">
                            <i className="fa-solid fa-trash-can cv-recording-cancel" onClick={cancelRecording}></i>
                            <span className="cv-recording-dot"></span>
                            <span className="cv-recording-time">{formatRecordingTime(recordingTime)}</span>
                            <span className="cv-recording-hint">Recording…</span>
                          </div>
                        )}

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
                      src={selectedGroup.groupImage}
                      alt=""
                      className="cv-info-avatar"
                      onClick={() =>
                        setPreviewImage(selectedGroup.groupImage)
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
                          <i className="fa-solid fa-remove"></i>
                        </div>
                        <p>Clear Chat</p>
                      </div>
                    )}

                  
                      <div className="cv-action danger" onClick={handleLeaveGroup}>
                        <div className="cv-action-circle">
                          <i className="fa-solid fa-right-from-bracket"></i>
                        </div>
                        <p>Leave</p>
                      </div>
                 
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
                            type="button"
                            className="cv-code-btn"
                            onClick={copyInviteCode}
                            title="Copy code"
                          >
                            <i className="fa-solid fa-copy"></i>
                          </button>

                          <button
                            type="button"
                            className="cv-code-btn cv-code-btn-danger"
                            onClick={regenerateCode}
                            disabled={regenLoading}
                            title="Regenerate code"
                          >
                            <i
                              className={`fa-solid fa-rotate-right ${regenLoading ? "fa-spin" : ""
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
                                {msg.mediaType === "image" ? (
                                  <img
                                    src={msg.media}
                                    alt=""
                                    onClick={() =>
                                      setPreviewImage(msg.media)
                                    }
                                  />
                                ) : msg.mediaType === "audio" ? (
                                  <VoiceMessagePlayer src={msg.media} isMine={msg.sender?._id === user?._id} />
                                ) : (
                                  <video controls src={msg.media} />
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
                          <button type="button" onClick={() => setPreviewImage(null)}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                      </div>
                    </div>
                  )}

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
                                  : selectedGroup?.groupImage
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
                            type="button"
                            className="cv-btn-ghost"
                            onClick={() => setShowEditGroupModal(false)}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
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
                            <img src={member.image} alt="" />
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
                        src={selectedGroup.groupImage}
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
                      <i
                        className="fa-solid fa-magnifying-glass"
                        onClick={() => setShowMsgSearch((prev) => !prev)}
                        title="Search messages"
                      ></i>
                      <i className="fa-solid fa-phone" onClick={() => triggerGroupCall(selectedGroup, "audio")}></i>
                      <i className="fa-solid fa-video" onClick={() => triggerGroupCall(selectedGroup, "video")}></i>
                      <i className="fa-solid fa-circle-info" onClick={() => setShowGroupInfo(true)}></i>
                    </div>

                  </div>

          
                  {showMsgSearch && renderMsgSearchBar()}

                 <div className="cv-thread" ref={messagesContainerRef}>

  {hasMoreMessages && (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <button
        type="button"
        className="cv-load-more-btn"
        onClick={handleLoadOlderMessages}
        disabled={loadingOlderMessages}
      >
        {loadingOlderMessages ? "Loading..." : "Load older messages"}
      </button>
    </div>
  )}

  {mergedGroupThread.map((item, index) => {

                      if (item._kind === "call") {
                        return renderGroupCallLog(item.data);
                      }

                      const msg = item.data;
                      const senderName = msg.sender?.name || msg.sender;
                      const isMe = senderName === user?.name;
                      const side = isMe ? "mine" : "theirs";

                      let prevMsg = null;
                      for (let i = index - 1; i >= 0; i--) {
                        if (mergedGroupThread[i]._kind === "message") {
                          prevMsg = mergedGroupThread[i].data;
                          break;
                        }
                      }
                      const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);

                      return (

                        <React.Fragment key={msg._id || index}>

                          {showDateSeparator && (
                            <div className="cv-date-separator">
                              <span>{getDateLabel(msg.createdAt)}</span>
                            </div>
                          )}

                          <div
                            className={`cv-msg-row ${side}`}
                            ref={(el) => (messageRefs.current[msg._id] = el)}
                          >

                            {!isMe && (
                              <div className="cv-bubble-avatar-wrap">
                                <img
                                  src={msg.sender?.image}
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
                                  {msg.isDeleted ? msg.message : highlightText(msg.message, msg._id)}
                                  {msg.isEdited && !msg.isDeleted && (
                                    <div className="cv-edited-tag">edited</div>
                                  )}
                                </div>
                              )}

                              {msg.media && (
                                <>
                                  {msg.mediaType === "image" ? (
                                    <img src={msg.media} className="cv-media" alt="" onClick={() => setPreviewImage(msg.media)} />
                                  ) : msg.mediaType === "audio" ? (
                                    <VoiceMessagePlayer src={msg.media} isMine={isMe} />
                                  ) : (
                                    <video src={msg.media} className="cv-media" controls />
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
                      ) : media.type.startsWith("audio") ? (
                        <audio controls src={URL.createObjectURL(media)} />
                      ) : (
                        <video src={URL.createObjectURL(media)} controls />
                      )}
                      <i className="fa-solid fa-xmark cv-media-remove" onClick={() => { setMedia(null); setMediaKind(null); }}></i>
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

                    <div
                      ref={emojiPickerRef}
                      style={{ position: "relative", display: "flex", alignItems: "center" }}
                    >
                      <div
                        className="cv-attach"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                      >
                        <i className="fa-solid fa-face-smile"></i>
                      </div>

                      {showEmojiPicker && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "48px",
                            left: 0,
                            width: "260px",
                            maxHeight: "220px",
                            overflowY: "auto",
                            background: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: "10px",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                            padding: "8px",
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: "4px",
                            zIndex: 20,
                          }}
                        >
                          {EMOJI_LIST.map((emoji, i) => (
                            <span
                              key={i}
                              onClick={() => appendEmoji(emoji)}
                              style={{
                                fontSize: "20px",
                                cursor: "pointer",
                                textAlign: "center",
                                lineHeight: "28px",
                                borderRadius: "6px",
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Write a message…"
                      value={message}
                      onChange={(e) => handleGroupTyping(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />

                    <button
                      type="button"
                      className="cv-send"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={
                        sendingMessage
                          ? undefined
                          : message.trim() || media
                            ? sendMessage
                            : isRecording
                              ? stopRecording
                              : startRecording
                      }
                      disabled={sendingMessage}
                    >
                      {sendingMessage ? (
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                      ) : message.trim() || media ? (
                        <i className="fa-solid fa-paper-plane"></i>
                      ) : isRecording ? (
                        <i className="fa-solid fa-stop" style={{ color: "red" }}></i>
                      ) : (
                        <i className="fa-solid fa-microphone"></i>
                      )}
                    </button>

                    {isRecording && (
                      <div className="cv-recording-bar">
                        <i className="fa-solid fa-trash-can cv-recording-cancel" onClick={cancelRecording}></i>
                        <span className="cv-recording-dot"></span>
                        <span className="cv-recording-time">{formatRecordingTime(recordingTime)}</span>
                        <span className="cv-recording-hint">Recording…</span>
                      </div>
                    )}

                  </div>

                </>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>

    

    <div className="modal fade" id="createGroupModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cv-modal-content" style={{ position: "relative" }}>

          {creatingGroup && <Loader />}

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
            <button type="button" className="cv-btn-ghost" data-bs-dismiss="modal" disabled={creatingGroup}>Cancel</button>
            <button
              type="button"
              className="cv-btn-primary"
              onClick={createGroup}
              disabled={creatingGroup}
            >
              {creatingGroup ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin me-2"></i>
                  Creating…
                </>
              ) : (
                "Create group"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>

  

    <div
      className="modal fade"
      id="joinGroupModal"
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content cv-modal-content" style={{ position: "relative" }}>

          {joiningGroup && <Loader />}

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
              type="button"
              className="cv-btn-ghost"
              data-bs-dismiss="modal"
              onClick={() => setJoinCode("")}
            >
              Cancel
            </button>

            <button
              type="button"
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

     
    <div className={`modal fade ${showForwardModal ? "show d-block" : ""}`} tabIndex="-1">

      <div className="modal-dialog modal-dialog-centered">

        <div className="modal-content cv-modal-content" style={{ position: "relative" }}>

          {forwarding && <Loader />}

          <div className="modal-header cv-modal-header">
            <h5>Forward message</h5>
            <button
              type="button"
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
                            src={g.groupImage}
                            alt=""
                          />
                          <div className="flex-grow-1">
                            <div className="cv-row-name">{g.groupName}</div>
                            <div className="cv-row-sub">{g.members.length} members</div>
                          </div>
                          <i
                            className={`fa-solid ${isChecked ? "fa-circle-check" : "fa-circle"
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
                            src={u.image}
                            alt=""
                          />
                          <div className="flex-grow-1">
                            <div className="cv-row-name">{u.name}</div>
                            <div className="cv-row-sub">{u.email}</div>
                          </div>
                          <i
                            className={`fa-solid ${isChecked ? "fa-circle-check" : "fa-circle"
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
              type="button"
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
              type="button"
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

    
<div className={`modal fade ${showAddUserModal ? "show d-block" : ""}`} tabIndex="-1">

      <div className="modal-dialog modal-dialog-centered">

        <div className="modal-content cv-modal-content" style={{ position: "relative" }}>

          {actionLoading && <Loader />}

          <div className="modal-header cv-modal-header">
            <h5>Add member</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setShowAddUserModal(false);
                setSelectedMemberToAdd("");
              }}
            ></button>
          </div>

          <div className="modal-body">

            <select
              className="form-select cv-input"
              value={selectedMemberToAdd}
              onChange={(e) => setSelectedMemberToAdd(e.target.value)}
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
            <button
              type="button"
              className="cv-btn-ghost"
              onClick={() => {
                setShowAddUserModal(false);
                setSelectedMemberToAdd("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
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

    {showAddUserModal && <div className="modal-backdrop fade show"></div>}
   

  </>
  );
};

export default MyGroups;