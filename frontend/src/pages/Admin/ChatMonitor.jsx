import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import { FaComments, FaUsers, FaPen, FaTrash, FaArrowLeft, FaCircle } from "react-icons/fa";

// ⚠️ If your app already has a shared socket instance/context (e.g. a
// SocketContext used by the main chat screens), reuse that instead of
// creating a second connection here. This creates its own connection
// scoped to the admin panel so it works standalone.
const SOCKET_URL = process.env.REACT_APP_API_URL;

// pagination constants — same pattern as SideBar.jsx
const USER_LIMIT = 10;
const GROUP_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 500;

// Builds a compact list of page numbers with "..." for large page counts.
// e.g. total=12, current=6 -> [1, "...", 5, 6, 7, "...", 12]
const renderPageNumbers = (current, total) => {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
};

// reusable Prev / 1 2 3 / Next pagination bar
const PaginationBar = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="d-flex justify-content-center align-items-center gap-1 mt-2 flex-wrap">
      <button
        type="button"
        className="btn btn-sm btn-outline-dark"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Prev
      </button>

      {renderPageNumbers(page, totalPages).map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`btn btn-sm ${p === page ? "btn-warning" : "btn-outline-dark"}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        className="btn btn-sm btn-outline-dark"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </button>
    </nav>
  );
};

const ChatMonitor = () => {
  const { token } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("private");

  // ============== USERS LIST (paginated + debounced search) ==============
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const userRequestIdRef = useRef(0);
  const isFirstUserSearchRef = useRef(true);

  const [chatUser, setChatUser] = useState(null);
  const [chatView, setChatView] = useState("list");
  const [userChats, setUserChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatActionId, setChatActionId] = useState(null);

  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [groupsModalUser, setGroupsModalUser] = useState(null);

  // ============== GROUPS LIST (paginated + debounced search) ==============
  const [groups, setGroups] = useState([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupSearch, setGroupSearch] = useState("");
  const [debouncedGroupSearch, setDebouncedGroupSearch] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const groupRequestIdRef = useRef(0);
  const isFirstGroupSearchRef = useRef(true);

  const [chatGroup, setChatGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);

  const [editingType, setEditingType] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [editingMessageImage, setEditingMessageImage] = useState(null);
  const [editingMessageImagePreview, setEditingMessageImagePreview] = useState("");
  const [messageActionId, setMessageActionId] = useState(null);
  const [clearingChat, setClearingChat] = useState(false);

  // ============== REAL-TIME (socket.io) ==============
  const socketRef = useRef(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  const totalUserPages = Math.max(1, Math.ceil(totalUsers / USER_LIMIT));
  const totalGroupPages = Math.max(1, Math.ceil(totalGroups / GROUP_LIMIT));

  // Refs mirror the "currently open" chat/group so socket callbacks
  // (registered once) always see the latest value instead of a stale
  // closure from when the listener was attached.
  const selectedChatRef = useRef(null);
  const chatGroupRef = useRef(null);
  const chatUserRef = useRef(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    chatGroupRef.current = chatGroup;
  }, [chatGroup]);

  useEffect(() => {
    chatUserRef.current = chatUser;
  }, [chatUser]);

  const isUserOnline = (userId) => onlineUserIds.has(userId);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    // ---- live online / offline presence ----
    socket.on("onlineUsers", (ids) => {
      setOnlineUserIds(new Set(ids));
    });

    // ---- live private chat messages ----
    socket.on("receivePrivateMessage", (msg) => {
      if (selectedChatRef.current && msg.chatId === selectedChatRef.current._id) {
        setMessages((prev) =>
          prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
        );
      }

      setUserChats((prev) => {
        if (!prev.some((c) => c._id === msg.chatId)) return prev;
        return prev
          .map((c) =>
            c._id === msg.chatId ? { ...c, updatedAt: new Date().toISOString() } : c
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    });

    socket.on("privateMessageUpdated", (msg) => {
      if (selectedChatRef.current && msg.chatId === selectedChatRef.current._id) {
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
      }
    });

    socket.on("privateMessageDeleted", ({ _id, chatId }) => {
      if (selectedChatRef.current && chatId === selectedChatRef.current._id) {
        setMessages((prev) => prev.filter((m) => m._id !== _id));
      }
    });

    socket.on("privateChatCleared", ({ chatId }) => {
      if (selectedChatRef.current && chatId === selectedChatRef.current._id) {
        setMessages([]);
      }
    });

    socket.on("privateChatDeleted", ({ chatId }) => {
      setUserChats((prev) => prev.filter((c) => c._id !== chatId));
      if (selectedChatRef.current && chatId === selectedChatRef.current._id) {
        setSelectedChat(null);
        setMessages([]);
        setChatView("list");
      }
    });

    // ---- live group chat messages ----
    socket.on("receiveMessage", (msg) => {
      if (chatGroupRef.current && msg.groupId === chatGroupRef.current._id) {
        setGroupMessages((prev) =>
          prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
        );
      }
    });

    socket.on("groupMessageUpdated", (msg) => {
      if (chatGroupRef.current && msg.groupId === chatGroupRef.current._id) {
        setGroupMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
      }
    });

    socket.on("groupMessageDeleted", ({ _id, groupId }) => {
      if (chatGroupRef.current && groupId === chatGroupRef.current._id) {
        setGroupMessages((prev) => prev.filter((m) => m._id !== _id));
      }
    });

    socket.on("groupChatCleared", ({ groupId }) => {
      if (chatGroupRef.current && groupId === chatGroupRef.current._id) {
        setGroupMessages([]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const showErrorAlert = (error, fallbackText) => {
    const backendMsg = error?.response?.data?.msg || error?.response?.data?.message;

    Swal.fire({
      title: "Error",
      text: backendMsg || fallbackText,
      icon: "error",
      background: "#1c1812",
      color: "#f2ece2",
      confirmButtonColor: "#e8a33d",
    });
  };

  // ============== FETCH USERS (paginated + searchable) ==============
  const fetchUsers = async (term, page) => {
    const currentRequestId = ++userRequestIdRef.current;

    setLoadingUsers(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        {
          params: { search: term, page, limit: USER_LIMIT },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ignore stale responses if a newer request has since been fired
      if (currentRequestId !== userRequestIdRef.current) return;

      const list = res.data.users || [];
      setUsers(list);
      setTotalUsers(res.data.pagination?.total ?? list.length);
      setUserPage(page);
    } catch (error) {
      console.log(error);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ============== FETCH GROUPS (paginated + searchable) ==============
  const fetchGroups = async (term, page) => {
    const currentRequestId = ++groupRequestIdRef.current;

    setLoadingGroups(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-group`,
        {
          params: { search: term, page, limit: GROUP_LIMIT },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (currentRequestId !== groupRequestIdRef.current) return;

      const list = res.data.groups || [];
      setGroups(list);
      setTotalGroups(res.data.pagination?.total ?? list.length);
      setGroupPage(page);
    } catch (error) {
      console.log(error);
      setGroups([]);
      setTotalGroups(0);
    } finally {
      setLoadingGroups(false);
    }
  };

  // initial load — page 1, no search term
  useEffect(() => {
    fetchUsers("", 1);
    fetchGroups("", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce user search input — 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // debounce group search input — 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGroupSearch(groupSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [groupSearch]);

  // re-fetch users whenever the debounced term changes (skip the very
  // first run, since the mount effect above already fetched page 1) —
  // always resets back to page 1
  useEffect(() => {
    if (isFirstUserSearchRef.current) {
      isFirstUserSearchRef.current = false;
      return;
    }
    fetchUsers(debouncedUserSearch, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUserSearch]);

  // re-fetch groups whenever the debounced term changes
  useEffect(() => {
    if (isFirstGroupSearchRef.current) {
      isFirstGroupSearchRef.current = false;
      return;
    }
    fetchGroups(debouncedGroupSearch, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedGroupSearch]);

  const handleUserPageChange = (newPage) => {
    if (newPage < 1 || newPage > totalUserPages) return;
    if (newPage === userPage || loadingUsers) return;
    fetchUsers(debouncedUserSearch, newPage);
  };

  const handleGroupPageChange = (newPage) => {
    if (newPage < 1 || newPage > totalGroupPages) return;
    if (newPage === groupPage || loadingGroups) return;
    fetchGroups(debouncedGroupSearch, newPage);
  };

  const getOtherMember = (chat) => {
    if (!chatUser) return null;
    return chat.members?.find((m) => m._id !== chatUser._id) || null;
  };

  const openChatsForUser = async (user) => {
    setChatUser(user);
    setChatView("list");
    setUserChats([]);
    setSelectedChat(null);
    setMessages([]);
    setLoadingChats(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-user-chats/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserChats(res.data.chats || []);
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not load user's chats.");
    } finally {
      setLoadingChats(false);
    }
  };

  const backToUserList = () => {
    setChatUser(null);
    setChatView("list");
    setUserChats([]);
    setSelectedChat(null);
    setMessages([]);
    cancelEditMessage();
  };

  const openChatMessages = async (chat) => {
    setSelectedChat(chat);
    setChatView("messages");
    setMessages([]);
    setLoadingMessages(true);

    // join the room so live message/edit/delete/clear events for this
    // conversation reach this admin session
    socketRef.current?.emit("joinPrivateChat", chat._id);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-private-messages/${chat._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data.messages || []);
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not load chat messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const backToChatList = () => {
    setChatView("list");
    setSelectedChat(null);
    setMessages([]);
    cancelEditMessage();
  };

  const handleClearChatFromList = (chat) => {
    const other = getOtherMember(chat);

    Swal.fire({
      title: "Clear This Chat?",
      text: `Every message between ${chatUser.name} and ${other?.name || "this user"} will be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setChatActionId(chat._id);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/clear-private-chat`,
          { chatId: chat._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (selectedChat?._id === chat._id) setMessages([]);

        Swal.fire({
          title: "Cleared",
          text: "All messages have been removed.",
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not clear chat.");
      } finally {
        setChatActionId(null);
      }
    });
  };

  const handleDeleteChatFromList = (chat) => {
    const other = getOtherMember(chat);

    Swal.fire({
      title: "Delete This Chat?",
      text: `This permanently removes the entire conversation between ${chatUser.name} and ${other?.name || "this user"}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setChatActionId(chat._id);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/delete-private-chat`,
          { chatId: chat._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUserChats((prev) => prev.filter((c) => c._id !== chat._id));

        if (selectedChat?._id === chat._id) backToChatList();

        Swal.fire({
          title: "Deleted",
          text: "Chat has been removed.",
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not delete chat.");
      } finally {
        setChatActionId(null);
      }
    });
  };

  const handleClearOpenPrivateChat = () => {
    if (!selectedChat) return;

    Swal.fire({
      title: "Clear All Chat?",
      text: "This will permanently delete every message in this conversation.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setClearingChat(true);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/clear-private-chat`,
          { chatId: selectedChat._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages([]);

        Swal.fire({
          title: "Cleared",
          text: "All messages have been removed.",
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not clear chat.");
      } finally {
        setClearingChat(false);
      }
    });
  };

  const openGroupsForUser = (user) => {
    setGroupsModalUser(user);
  };

  const closeGroupsModal = () => {
    setGroupsModalUser(null);
  };

  // ⚠️ NOTE: `groups` now only holds the currently-loaded page of the
  // main Groups list (paginated, 10 at a time). This modal filters from
  // that same in-memory array, so if the user is a member of a group that
  // isn't on the currently loaded page, it won't show up here.
  // For fully accurate results regardless of pagination, add a dedicated
  // backend route (e.g. GET /api/admin/get-groups-for-user/:userId that
  // queries `{ members: userId }` directly) and call that here instead.
  const getGroupsForUser = (user) => {
    if (!user) return [];
    return groups.filter(
      (g) =>
        g.members?.includes(user._id) ||
        g.createdBy === user._id ||
        g.members?.some((m) => (typeof m === "object" ? m._id === user._id : m === user._id))
    );
  };

  const goToGroupChatFromModal = (group) => {
    closeGroupsModal();
    setActiveTab("group");
    openChatsForGroup(group);
  };

  const openChatsForGroup = async (group) => {
    setChatGroup(group);
    setLoadingGroupMessages(true);
    setGroupMessages([]);

    // join the group's room so live message/edit/delete/clear events reach
    // this admin session
    socketRef.current?.emit("joinGroup", group._id);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-group-messages/${group._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroupMessages(res.data.messages || []);
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not load chat messages.");
    } finally {
      setLoadingGroupMessages(false);
    }
  };

  const backToGroupList = () => {
    setChatGroup(null);
    setGroupMessages([]);
    cancelEditMessage();
  };

  const handleClearGroupChat = () => {
    if (!chatGroup) return;

    Swal.fire({
      title: "Clear All Chat?",
      text: `This will permanently delete every message in "${chatGroup.groupName}". This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setClearingChat(true);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/clear-group-chat`,
          { groupId: chatGroup._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setGroupMessages([]);

        Swal.fire({
          title: "Cleared",
          text: "All messages have been removed.",
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not clear chat.");
      } finally {
        setClearingChat(false);
      }
    });
  };

  const startEditMessage = (msg, type) => {
    setEditingType(type);
    setEditingMessageId(msg._id);
    setEditingMessageText(msg.message || "");
    setEditingMessageImage(null);
    setEditingMessageImagePreview(msg.mediaType === "image" ? msg.media : "");
  };

  const cancelEditMessage = () => {
    setEditingType(null);
    setEditingMessageId(null);
    setEditingMessageText("");
    setEditingMessageImage(null);
    setEditingMessageImagePreview("");
  };

  const handleEditMessageImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditingMessageImage(file);
    setEditingMessageImagePreview(URL.createObjectURL(file));
  };

  const saveEditMessage = async (msg) => {
    const isPrivate = editingType === "private";

    try {
      setMessageActionId(msg._id);

      const formData = new FormData();
      formData.append("messageId", msg._id);
      formData.append("message", editingMessageText);
      if (editingMessageImage) formData.append("image", editingMessageImage);

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/${
          isPrivate ? "edit-private-message" : "edit-group-message"
        }`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updated = res.data.message;

      if (isPrivate) {
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, ...updated } : m)));
      } else {
        setGroupMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, ...updated } : m))
        );
      }

      cancelEditMessage();
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not update message.");
    } finally {
      setMessageActionId(null);
    }
  };

  const handleDeleteMessage = (msg, type) => {
    const isPrivate = type === "private";

    Swal.fire({
      title: "Delete Message?",
      text: "This message will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setMessageActionId(msg._id);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/${
            isPrivate ? "delete-private-message" : "delete-group-message"
          }`,
          { messageId: msg._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (isPrivate) {
          setMessages((prev) => prev.filter((m) => m._id !== msg._id));
        } else {
          setGroupMessages((prev) => prev.filter((m) => m._id !== msg._id));
        }
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not delete message.");
      } finally {
        setMessageActionId(null);
      }
    });
  };

  const renderMessageMedia = (msg) => {
    if (!msg.media) return null;

    const commonStyle = {
      maxWidth: "260px",
      maxHeight: "260px",
      borderRadius: "10px",
      display: "block",
      marginTop: msg.message ? "6px" : "0",
    };

    if (msg.mediaType === "image") {
      return (
        <img
          src={msg.media}
          alt="attachment"
          style={{ ...commonStyle, objectFit: "cover", cursor: "pointer" }}
          onClick={() => window.open(msg.media, "_blank")}
        />
      );
    }

    if (msg.mediaType === "video") {
      return <video src={msg.media} controls style={{ ...commonStyle, background: "#000" }} />;
    }

    if (msg.mediaType === "audio") {
      return (
        <audio
          src={msg.media}
          controls
          style={{ marginTop: msg.message ? "6px" : "0", maxWidth: "260px" }}
        />
      );
    }

    return (
      <a
        href={msg.media}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", marginTop: msg.message ? "6px" : "0" }}
      >
        View attachment
      </a>
    );
  };

  const renderMessageRow = (msg, type) => {
    const isEditing = editingType === type && editingMessageId === msg._id;
    const isBusy = messageActionId === msg._id;

    return (
      <div className="chat-message-row" key={msg._id}>
        <img
          src={msg.sender?.image}
          alt=""
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />

        <div className="chat-message-content">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-semibold" style={{ fontSize: "13px" }}>
              {msg.sender?.name || "Unknown"}
            </span>
            <span className="text-muted" style={{ fontSize: "11px" }}>
              {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
            </span>
            {msg.isEdited && (
              <span className="text-muted" style={{ fontSize: "10.5px" }}>
                (edited)
              </span>
            )}
          </div>

          {isEditing ? (
            <div>
              {editingMessageImagePreview && (
                <img
                  src={editingMessageImagePreview}
                  alt=""
                  style={{
                    maxWidth: "160px",
                    maxHeight: "160px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    display: "block",
                    marginBottom: "8px",
                  }}
                />
              )}

              <div className="d-flex gap-2 align-items-center flex-wrap">
                <input
                  type="text"
                  className="form-control admin-input"
                  value={editingMessageText}
                  onChange={(e) => setEditingMessageText(e.target.value)}
                  disabled={isBusy}
                  autoFocus
                  style={{ minWidth: "160px", flex: "1 1 160px" }}
                />

                <label
                  htmlFor={`editMsgImage-${msg._id}`}
                  className="btn btn-sm btn-outline-warning mb-0"
                >
                  {editingMessageImagePreview ? "Change Image" : "Add Image"}
                </label>
                <input
                  id={`editMsgImage-${msg._id}`}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleEditMessageImageChange}
                  disabled={isBusy}
                />

                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => saveEditMessage(msg)}
                  disabled={isBusy}
                >
                  {isBusy ? "..." : "Save"}
                </button>
                <button
                  className="btn btn-sm btn-outline-dark"
                  onClick={cancelEditMessage}
                  disabled={isBusy}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {msg.message && (
                <div
                  className="chat-message-text"
                  style={{
                    fontFamily:
                      "inherit, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                  }}
                >
                  {msg.message}
                </div>
              )}
              {renderMessageMedia(msg)}
            </>
          )}
        </div>

        {!isEditing && (
          <div className="chat-message-actions">
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => startEditMessage(msg, type)}
              disabled={isBusy}
              title="Edit message"
            >
              <FaPen size={11} />
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteMessage(msg, type)}
              disabled={isBusy}
              title="Delete message"
            >
              <FaTrash size={11} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // search is now server-side (debounced), so `users` / `groups` already
  // reflect the current search term — no client-side filtering needed
  const modalUserGroups = getGroupsForUser(groupsModalUser);

  // small reusable presence dot, overlaid on an avatar
  const PresenceDot = ({ online }) => (
    <FaCircle
      size={9}
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        color: online ? "#2ecc71" : "#b0b0b0",
        background: "#fff",
        borderRadius: "50%",
      }}
    />
  );

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Chat Monitor</h2>
          <p className="text-muted mb-0">View and moderate private &amp; group conversations — live</p>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex gap-2 mb-4">
          <button
            className={`btn btn-sm ${activeTab === "private" ? "btn-warning" : "btn-outline-dark"}`}
            onClick={() => setActiveTab("private")}
          >
            <FaComments size={11} className="me-1" />
            Private Chats
          </button>
          <button
            className={`btn btn-sm ${activeTab === "group" ? "btn-warning" : "btn-outline-dark"}`}
            onClick={() => setActiveTab("group")}
          >
            <FaUsers size={11} className="me-1" />
            Group Chats
          </button>
        </div>

        {activeTab === "private" && (
          <>
            {!chatUser && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h5 className="fw-bold m-0">Select a User</h5>
                  <input
                    type="text"
                    className="form-control admin-search"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ maxWidth: "260px" }}
                  />
                </div>

                {loadingUsers && (
                  <div className="text-center text-muted py-4">Loading users...</div>
                )}

                {!loadingUsers && users.length === 0 && (
                  <div className="text-center text-muted py-4">No users found.</div>
                )}

                {!loadingUsers &&
                  users.map((user) => (
                    <div className="member-row" key={user._id}>
                      <div
                        className="d-flex align-items-center gap-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => openChatsForUser(user)}
                      >
                        <div style={{ position: "relative" }}>
                          <img
                            src={user.image}
                            alt=""
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              background: "var(--panel-2)",
                            }}
                          />
                          <PresenceDot online={isUserOnline(user._id)} />
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: "13px" }}>
                            {user.name}
                            {user.isBlocked && (
                              <span className="badge bg-danger ms-2" style={{ fontSize: "9px" }}>
                                Blocked
                              </span>
                            )}
                          </div>
                          <div className="text-muted" style={{ fontSize: "11.5px" }}>
                            {isUserOnline(user._id) ? (
                              <span style={{ color: "#2ecc71" }}>Online</span>
                            ) : (
                              "Offline"
                            )}
                            {" · "}
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openGroupsForUser(user)}
                          title="See all groups this user is a member of"
                        >
                          <FaUsers size={11} className="me-1" />
                          View Groups
                        </button>

                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => openChatsForUser(user)}
                        >
                          <FaComments size={11} className="me-1" />
                          View Chats
                        </button>
                      </div>
                    </div>
                  ))}

                {!loadingUsers && (
                  <PaginationBar
                    page={userPage}
                    totalPages={totalUserPages}
                    onPageChange={handleUserPageChange}
                  />
                )}
              </>
            )}

            {chatUser && chatView === "list" && (
              <>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={backToUserList}
                    title="Back to users"
                  >
                    <FaArrowLeft size={11} />
                  </button>
                  <div style={{ position: "relative" }}>
                    <img
                      src={chatUser.image}
                      alt=""
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <PresenceDot online={isUserOnline(chatUser._id)} />
                  </div>
                  <h5 className="fw-bold m-0">{chatUser.name} — Conversations</h5>
                </div>

                {loadingChats && (
                  <div className="text-center text-muted py-4">Loading conversations...</div>
                )}

                {!loadingChats && userChats.length === 0 && (
                  <div className="text-center text-muted py-4">
                    This user has no private conversations yet.
                  </div>
                )}

                {!loadingChats &&
                  userChats.map((chat) => {
                    const other = getOtherMember(chat);
                    const isBusy = chatActionId === chat._id;

                    return (
                      <div className="member-row" key={chat._id}>
                        <div
                          className="d-flex align-items-center gap-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => openChatMessages(chat)}
                        >
                          <div style={{ position: "relative" }}>
                            <img
                              src={other?.image}
                              alt=""
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                background: "var(--panel-2)",
                              }}
                            />
                            {other && <PresenceDot online={isUserOnline(other._id)} />}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ fontSize: "13px" }}>
                              {other?.name || "Unknown user"}
                              {other?.isBlocked && (
                                <span className="badge bg-danger ms-2" style={{ fontSize: "9px" }}>
                                  Blocked
                                </span>
                              )}
                            </div>
                            <div className="text-muted" style={{ fontSize: "11.5px" }}>
                              {other?.email}
                              {chat.updatedAt &&
                                ` · updated ${new Date(chat.updatedAt).toLocaleString()}`}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => openChatMessages(chat)}
                            disabled={isBusy}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleClearChatFromList(chat)}
                            disabled={isBusy}
                          >
                            {isBusy ? "..." : "Clear"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteChatFromList(chat)}
                            disabled={isBusy}
                          >
                            {isBusy ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {chatUser && chatView === "messages" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark"
                      onClick={backToChatList}
                      title="Back to conversations"
                    >
                      <FaArrowLeft size={11} />
                    </button>
                    <div style={{ position: "relative" }}>
                      <img
                        src={getOtherMember(selectedChat)?.image}
                        alt=""
                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      {getOtherMember(selectedChat) && (
                        <PresenceDot online={isUserOnline(getOtherMember(selectedChat)._id)} />
                      )}
                    </div>
                    <h5 className="fw-bold m-0">
                      {chatUser.name} ↔ {getOtherMember(selectedChat)?.name || "Unknown"}
                    </h5>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleClearOpenPrivateChat}
                    disabled={clearingChat || messages.length === 0}
                  >
                    <FaTrash size={11} className="me-1" />
                    {clearingChat ? "Clearing..." : "Clear All Chat"}
                  </button>
                </div>

                {loadingMessages && (
                  <div className="text-center text-muted py-4">Loading messages...</div>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <div className="text-center text-muted py-4">
                    No messages in this conversation yet.
                  </div>
                )}

                {!loadingMessages && messages.map((msg) => renderMessageRow(msg, "private"))}
              </>
            )}
          </>
        )}

        {activeTab === "group" && (
          <>
            {!chatGroup && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h5 className="fw-bold m-0">Select a Group</h5>
                  <input
                    type="text"
                    className="form-control admin-search"
                    placeholder="Search by group name..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    style={{ maxWidth: "260px" }}
                  />
                </div>

                {loadingGroups && (
                  <div className="text-center text-muted py-4">Loading groups...</div>
                )}

                {!loadingGroups && groups.length === 0 && (
                  <div className="text-center text-muted py-4">No groups found.</div>
                )}

                {!loadingGroups &&
                  groups.map((group) => (
                    <div className="member-row" key={group._id}>
                      <div
                        className="d-flex align-items-center gap-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => openChatsForGroup(group)}
                      >
                        <img
                          src={group.groupImage}
                          alt=""
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            background: "var(--panel-2)",
                          }}
                        />
                        <div>
                          <div className="fw-semibold" style={{ fontSize: "13px" }}>
                            {group.groupName}
                          </div>
                          <div className="text-muted" style={{ fontSize: "11.5px" }}>
                            {group.members?.length ?? 0} member
                            {group.members?.length === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => openChatsForGroup(group)}
                      >
                        <FaComments size={11} className="me-1" />
                        View Chat
                      </button>
                    </div>
                  ))}

                {!loadingGroups && (
                  <PaginationBar
                    page={groupPage}
                    totalPages={totalGroupPages}
                    onPageChange={handleGroupPageChange}
                  />
                )}
              </>
            )}

            {chatGroup && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark"
                      onClick={backToGroupList}
                      title="Back to groups"
                    >
                      <FaArrowLeft size={11} />
                    </button>
                    <img
                      src={chatGroup.groupImage}
                      alt=""
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <h5 className="fw-bold m-0">{chatGroup.groupName} — Chat Log</h5>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleClearGroupChat}
                    disabled={clearingChat || groupMessages.length === 0}
                  >
                    <FaTrash size={11} className="me-1" />
                    {clearingChat ? "Clearing..." : "Clear All Chat"}
                  </button>
                </div>

                {loadingGroupMessages && (
                  <div className="text-center text-muted py-4">Loading messages...</div>
                )}

                {!loadingGroupMessages && groupMessages.length === 0 && (
                  <div className="text-center text-muted py-4">No messages in this group yet.</div>
                )}

                {!loadingGroupMessages &&
                  groupMessages.map((msg) => renderMessageRow(msg, "group"))}
              </>
            )}
          </>
        )}
      </div>

      {groupsModalUser && (
        <>
          <div
            className="modal fade show d-block admin-edit-modal"
            tabIndex="-1"
            role="dialog"
            onClick={closeGroupsModal}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <img
                      src={groupsModalUser.image}
                      alt=""
                      style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    {groupsModalUser.name} — Groups
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeGroupsModal}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  {modalUserGroups.length === 0 ? (
                    <div className="text-center text-muted py-3">
                      This user is not a member of any group.
                    </div>
                  ) : (
                    <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                      {modalUserGroups.map((group) => {
                        const isAdmin = group.createdBy === groupsModalUser._id;

                        return (
                          <div className="member-row" key={group._id}>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={group.groupImage}
                                alt=""
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  background: "var(--panel-2)",
                                }}
                              />
                              <div>
                                <div className="fw-semibold" style={{ fontSize: "13px" }}>
                                  {group.groupName}
                                  {isAdmin && (
                                    <span className="badge bg-dark ms-2" style={{ fontSize: "9px" }}>
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted" style={{ fontSize: "11.5px" }}>
                                  {group.members?.length ?? 0} member
                                  {group.members?.length === 1 ? "" : "s"}
                                </div>
                              </div>
                            </div>

                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => goToGroupChatFromModal(group)}
                            >
                              <FaComments size={11} className="me-1" />
                              View Chat
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={closeGroupsModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default ChatMonitor;