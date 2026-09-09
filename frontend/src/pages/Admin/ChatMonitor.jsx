import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaComments,
  FaUsers,
  FaTrash,
  FaArrowLeft,
  FaCircle,
  FaPen,
  FaTimes,
  FaCheck,
  FaBan,
} from "react-icons/fa";
import { io } from "socket.io-client";

const USER_PAGE_LIMIT = 10;
const GROUP_PAGE_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;

const renderPagination = (currentPage, totalPages, onPageChange) => {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav className="d-flex justify-content-center align-items-center gap-1 mt-3 flex-wrap">
      <button
        type="button"
        className="btn btn-sm btn-outline-dark"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Prev
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`btn btn-sm ${p === currentPage ? "btn-warning" : "btn-outline-dark"}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        className="btn btn-sm btn-outline-dark"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  );
};

const ChatMonitor = () => {
  const { token } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("private");

  // Private Chats State
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [chatUser, setChatUser] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);

  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Group Chats State
  const [groups, setGroups] = useState([]);
  const [groupTotal, setGroupTotal] = useState(0);
  const [groupPage, setGroupPage] = useState(1);
  const [groupSearch, setGroupSearch] = useState("");
  const [debouncedGroupSearch, setDebouncedGroupSearch] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [chatGroup, setChatGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loadingGroupMessages, setLoadingGroupMessages] = useState(false);

  // Common Chat Actions
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [chatActionId, setChatActionId] = useState(null);
  const [clearingChat, setClearingChat] = useState(false);
  const [groupsModalUser, setGroupsModalUser] = useState(null);

  // Edit Message
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const socketRef = useRef(null);
  const selectedChatRef = useRef(selectedChat);
  const chatGroupRef = useRef(chatGroup);
  const messagesEndRef = useRef(null);
  const userRequestIdRef = useRef(0);
  const groupRequestIdRef = useRef(0);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    chatGroupRef.current = chatGroup;
  }, [chatGroup]);

  const totalUserPages = Math.max(1, Math.ceil(userTotal / USER_PAGE_LIMIT));
  const totalGroupPages = Math.max(1, Math.ceil(groupTotal / GROUP_PAGE_LIMIT));

  const isUserOnline = (userId) => onlineUserIds.includes(userId);

  const showErrorAlert = (error, fallbackText) => {
    const backendMsg = error?.response?.data?.message || error?.response?.data?.msg;
    Swal.fire({
      title: "Error",
      text: backendMsg || fallbackText,
      icon: "error",
      background: "#0d1217",
      color: "#f8fafc",
      confirmButtonColor: "#00f5a0",
    });
  };

  // 1. FETCH USERS
  const fetchUsers = async (term, page) => {
    const currentRequestId = ++userRequestIdRef.current;
    setLoadingUsers(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        {
          params: { search: term, page, limit: USER_PAGE_LIMIT },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (currentRequestId !== userRequestIdRef.current) return;
      const list = res.data.users || [];
      setUsers(list);
      setUserTotal(res.data.pagination?.total ?? list.length);
      setUserPage(page);
    } catch (error) {
      console.log(error);
      setUsers([]);
      setUserTotal(0);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [userSearch]);

  useEffect(() => {
    fetchUsers(debouncedUserSearch, 1);
  }, [debouncedUserSearch]);

  const handleUserPageChange = (newPage) => {
    if (newPage < 1 || newPage > totalUserPages || newPage === userPage) return;
    fetchUsers(debouncedUserSearch, newPage);
  };

  // 2. FETCH GROUPS
  const fetchGroups = async (term, page) => {
    const currentRequestId = ++groupRequestIdRef.current;
    setLoadingGroups(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-group`,
        {
          params: { search: term, page, limit: GROUP_PAGE_LIMIT },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (currentRequestId !== groupRequestIdRef.current) return;
      const list = res.data.groups || [];
      setGroups(list);
      setGroupTotal(res.data.pagination?.total ?? list.length);
      setGroupPage(page);
    } catch (error) {
      console.log(error);
      setGroups([]);
      setGroupTotal(0);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGroupSearch(groupSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [groupSearch]);

  useEffect(() => {
    fetchGroups(debouncedGroupSearch, 1);
  }, [debouncedGroupSearch]);

  const handleGroupPageChange = (newPage) => {
    if (newPage < 1 || newPage > totalGroupPages || newPage === groupPage) return;
    fetchGroups(debouncedGroupSearch, newPage);
  };

  // 3. SOCKET IO SETUP
  useEffect(() => {
    const s = io(process.env.REACT_APP_API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      s.emit("admin:join-monitor");
    });

    s.on("getOnlineUsers", (ids) => {
      setOnlineUserIds(ids || []);
    });

    s.on("admin:live-message", (data) => {
      const { message, chatType, chatId } = data || {};
      if (!message) return;

      if (
        chatType === "private" &&
        selectedChatRef.current &&
        selectedChatRef.current._id === chatId
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      if (
        chatType === "group" &&
        chatGroupRef.current &&
        chatGroupRef.current._id === chatId
      ) {
        setGroupMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    });

    s.on("admin:message-deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setGroupMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    s.on("admin:message-edited", ({ message }) => {
      if (!message) return;
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m))
      );
      setGroupMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m))
      );
    });

    s.on("admin:chat-cleared", ({ chatId, chatType }) => {
      if (chatType === "private" && selectedChatRef.current?._id === chatId) {
        setMessages([]);
      }
      if (chatType === "group" && chatGroupRef.current?._id === chatId) {
        setGroupMessages([]);
      }
    });

    socketRef.current = s;
    return () => {
      s.disconnect();
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages]);

  const getOtherMember = (chat) => {
    if (!chatUser) return null;
    return chat.members?.find((m) => m._id !== chatUser._id) || null;
  };

  const openChatsForUser = async (user) => {
    setChatUser(user);
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
      showErrorAlert(error, "Could not load chats for this user.");
    } finally {
      setLoadingChats(false);
    }
  };

  const backToUserList = () => {
    setChatUser(null);
    setSelectedChat(null);
    setMessages([]);
    setUserChats([]);
  };

  const openSpecificChat = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-private-messages/${chat._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data.messages || []);
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not load messages for this chat.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const backToChatList = () => {
    setSelectedChat(null);
    setMessages([]);
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
      background: "#0d1217",
      color: "#f8fafc",
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
          background: "#0d1217",
          color: "#f8fafc",
          confirmButtonColor: "#00f5a0",
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
      background: "#0d1217",
      color: "#f8fafc",
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
          background: "#0d1217",
          color: "#f8fafc",
          confirmButtonColor: "#00f5a0",
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
      background: "#0d1217",
      color: "#f8fafc",
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
          background: "#0d1217",
          color: "#f8fafc",
          confirmButtonColor: "#00f5a0",
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
    openGroupChat(group);
  };

  const openGroupChat = async (group) => {
    setChatGroup(group);
    setLoadingGroupMessages(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-group-messages/${group._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroupMessages(res.data.messages || []);
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not load messages for this group.");
    } finally {
      setLoadingGroupMessages(false);
    }
  };

  const backToGroupList = () => {
    setChatGroup(null);
    setGroupMessages([]);
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
      background: "#0d1217",
      color: "#f8fafc",
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
          background: "#0d1217",
          color: "#f8fafc",
          confirmButtonColor: "#00f5a0",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not clear chat.");
      } finally {
        setClearingChat(false);
      }
    });
  };

  const handleDeleteMessage = (msgId, isGroup) => {
    Swal.fire({
      title: "Delete Message?",
      text: "This message will be removed permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc3545",
      background: "#0d1217",
      color: "#f8fafc",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const endpoint = isGroup
          ? `/api/admin/delete-group-message/${msgId}`
          : `/api/admin/delete-private-message/${msgId}`;

        await axios.delete(`${process.env.REACT_APP_API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isGroup) {
          setGroupMessages((prev) => prev.filter((m) => m._id !== msgId));
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== msgId));
        }

        Swal.fire({
          title: "Deleted",
          text: "Message removed.",
          icon: "success",
          background: "#0d1217",
          color: "#f8fafc",
          confirmButtonColor: "#00f5a0",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not delete message.");
      }
    });
  };

  const startEditMessage = (msg) => {
    setEditingMessageId(msg._id);
    setEditMessageText(msg.text || msg.message || "");
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditMessageText("");
  };

  const saveEditMessage = async (msg, isGroup) => {
    if (!editMessageText.trim()) return;

    try {
      setSavingEdit(true);
      const endpoint = isGroup
        ? `/api/admin/edit-group-message/${msg._id}`
        : `/api/admin/edit-private-message/${msg._id}`;

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        { text: editMessageText, message: editMessageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data.message || res.data;

      if (isGroup) {
        setGroupMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, ...updated, text: editMessageText, message: editMessageText } : m))
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, ...updated, text: editMessageText, message: editMessageText } : m))
        );
      }

      cancelEditMessage();
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not edit message.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Chat Monitor</h2>
          <p className="text-muted mb-0">View and moderate private &amp; group conversations — live</p>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        {/* TOP TABS */}
        <div className="d-flex gap-2 mb-4">
          <button
            className={`btn btn-sm ${activeTab === "private" ? "btn-warning" : "btn-outline-dark"}`}
            onClick={() => {
              setActiveTab("private");
              backToUserList();
            }}
          >
            <FaComments size={11} className="me-1" />
            Private Chats
          </button>
          <button
            className={`btn btn-sm ${activeTab === "group" ? "btn-warning" : "btn-outline-dark"}`}
            onClick={() => {
              setActiveTab("group");
              backToGroupList();
            }}
          >
            <FaUsers size={11} className="me-1" />
            Group Chats
          </button>
        </div>

        {/* -------------------- PRIVATE CHATS TAB -------------------- */}
        {activeTab === "private" && (
          <>
            {/* VIEW 1: USER LIST */}
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
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <FaCircle
                            size={9}
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              color: isUserOnline(user._id) ? "#00f5a0" : "#64748b",
                              background: "#080b0e",
                              borderRadius: "50%",
                            }}
                          />
                        </div>
                        <div>
                          <div className="fw-semibold d-flex align-items-center gap-2">
                            <span>{user.name}</span>
                            {user.isBlocked && (
                              <span className="badge bg-danger" style={{ fontSize: "10px" }}>
                                Blocked
                              </span>
                            )}
                          </div>
                          <small className="text-muted">
                            {isUserOnline(user._id) ? "Online" : "Offline"} • {user.email}
                          </small>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => openGroupsForUser(user)}
                        >
                          <FaUsers size={11} className="me-1" />
                          View Groups
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => openChatsForUser(user)}
                        >
                          <FaComments size={11} className="me-1" />
                          View Chats
                        </button>
                      </div>
                    </div>
                  ))}

                {!loadingUsers && renderPagination(userPage, totalUserPages, handleUserPageChange)}
              </>
            )}

            {/* VIEW 2: CHATS OF SELECTED USER */}
            {chatUser && !selectedChat && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-outline-dark" onClick={backToUserList}>
                      <FaArrowLeft size={11} /> Back
                    </button>
                    <h5 className="fw-bold m-0">Conversations for {chatUser.name}</h5>
                  </div>
                </div>

                {loadingChats && (
                  <div className="text-center text-muted py-4">Loading conversations...</div>
                )}

                {!loadingChats && userChats.length === 0 && (
                  <div className="text-center text-muted py-4">No private chats found for this user.</div>
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
                          onClick={() => openSpecificChat(chat)}
                        >
                          <img
                            src={other?.image}
                            alt=""
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <div>
                            <div className="fw-semibold">{other?.name || "Unknown User"}</div>
                            <small className="text-muted">{other?.email || "No email"}</small>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => openSpecificChat(chat)}
                          >
                            View Conversation
                          </button>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => handleClearChatFromList(chat)}
                            disabled={isBusy}
                          >
                            Clear
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteChatFromList(chat)}
                            disabled={isBusy}
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {/* VIEW 3: LIVE MESSAGES OF SELECTED CHAT */}
            {chatUser && selectedChat && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-outline-dark" onClick={backToChatList}>
                      <FaArrowLeft size={11} /> Back
                    </button>
                    <h5 className="fw-bold m-0">
                      {chatUser.name} &amp; {getOtherMember(selectedChat)?.name || "User"}
                    </h5>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleClearOpenPrivateChat}
                    disabled={clearingChat}
                  >
                    <FaTrash size={11} className="me-1" />
                    Clear Chat
                  </button>
                </div>

                <div
                  className="p-3 rounded-3 mb-3"
                  style={{
                    background: "#080b0e",
                    border: "1px solid #1a2430",
                    height: "420px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {loadingMessages && (
                    <div className="text-center text-muted my-auto">Loading messages...</div>
                  )}

                  {!loadingMessages && messages.length === 0 && (
                    <div className="text-center text-muted my-auto">No messages in this chat.</div>
                  )}

                  {!loadingMessages &&
                    messages.map((msg) => {
                      const isSender = msg.sender === chatUser._id || msg.sender?._id === chatUser._id;
                      const isEditing = editingMessageId === msg._id;

                      return (
                        <div
                          key={msg._id}
                          className="d-flex flex-column"
                          style={{
                            alignSelf: isSender ? "flex-end" : "flex-start",
                            maxWidth: "75%",
                          }}
                        >
                          <div
                            className="p-2 px-3 rounded-3"
                            style={{
                              background: isSender ? "#00f5a0" : "#121820",
                              color: isSender ? "#080b0e" : "#f8fafc",
                              border: isSender ? "none" : "1px solid #1a2430",
                              fontWeight: isSender ? "600" : "400",
                              fontSize: "13.5px",
                              wordBreak: "break-word",
                            }}
                          >
                            {isEditing ? (
                              <div className="d-flex gap-1 align-items-center mt-1">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={editMessageText}
                                  onChange={(e) => setEditMessageText(e.target.value)}
                                />
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => saveEditMessage(msg, false)}
                                  disabled={savingEdit}
                                >
                                  <FaCheck size={10} />
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={cancelEditMessage}
                                >
                                  <FaTimes size={10} />
                                </button>
                              </div>
                            ) : (
                              <div>{msg.text || msg.message}</div>
                            )}
                          </div>

                          <div
                            className="d-flex align-items-center gap-2 mt-1 px-1"
                            style={{
                              fontSize: "10.5px",
                              color: "#64748b",
                              alignSelf: isSender ? "flex-end" : "flex-start",
                            }}
                          >
                            <span>
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                            {!isEditing && (
                              <>
                                <button
                                  className="btn btn-link p-0 text-muted"
                                  onClick={() => startEditMessage(msg)}
                                  title="Edit message"
                                >
                                  <FaPen size={9} />
                                </button>
                                <button
                                  className="btn btn-link p-0 text-danger"
                                  onClick={() => handleDeleteMessage(msg._id, false)}
                                  title="Delete message"
                                >
                                  <FaTrash size={9} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </>
        )}

        {/* -------------------- GROUP CHATS TAB -------------------- */}
        {activeTab === "group" && (
          <>
            {/* VIEW 1: GROUPS LIST */}
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
                        onClick={() => openGroupChat(group)}
                      >
                        <img
                          src={group.groupImage}
                          alt=""
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                        <div>
                          <div className="fw-semibold">{group.groupName}</div>
                          <small className="text-muted">
                            {group.members?.length || 0} Members • Code: {group.inviteCode || "—"}
                          </small>
                        </div>
                      </div>

                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => openGroupChat(group)}
                      >
                        <FaComments size={11} className="me-1" />
                        View Group Chat
                      </button>
                    </div>
                  ))}

                {!loadingGroups &&
                  renderPagination(groupPage, totalGroupPages, handleGroupPageChange)}
              </>
            )}

            {/* VIEW 2: GROUP LIVE CHAT */}
            {chatGroup && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-outline-dark" onClick={backToGroupList}>
                      <FaArrowLeft size={11} /> Back
                    </button>
                    <h5 className="fw-bold m-0">{chatGroup.groupName}</h5>
                    <span className="badge bg-dark">
                      {chatGroup.members?.length || 0} Members
                    </span>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleClearGroupChat}
                    disabled={clearingChat}
                  >
                    <FaTrash size={11} className="me-1" />
                    Clear Chat
                  </button>
                </div>

                <div
                  className="p-3 rounded-3 mb-3"
                  style={{
                    background: "#080b0e",
                    border: "1px solid #1a2430",
                    height: "420px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {loadingGroupMessages && (
                    <div className="text-center text-muted my-auto">Loading messages...</div>
                  )}

                  {!loadingGroupMessages && groupMessages.length === 0 && (
                    <div className="text-center text-muted my-auto">No messages in this group.</div>
                  )}

                  {!loadingGroupMessages &&
                    groupMessages.map((msg) => {
                      const senderName = msg.sender?.name || "User";
                      const isEditing = editingMessageId === msg._id;

                      return (
                        <div
                          key={msg._id}
                          className="d-flex flex-column"
                          style={{
                            maxWidth: "75%",
                            alignSelf: "flex-start",
                          }}
                        >
                          <small className="text-muted fw-semibold mb-1" style={{ fontSize: "11px" }}>
                            {senderName}
                          </small>
                          <div
                            className="p-2 px-3 rounded-3"
                            style={{
                              background: "#121820",
                              color: "#f8fafc",
                              border: "1px solid #1a2430",
                              fontSize: "13.5px",
                              wordBreak: "break-word",
                            }}
                          >
                            {isEditing ? (
                              <div className="d-flex gap-1 align-items-center mt-1">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={editMessageText}
                                  onChange={(e) => setEditMessageText(e.target.value)}
                                />
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => saveEditMessage(msg, true)}
                                  disabled={savingEdit}
                                >
                                  <FaCheck size={10} />
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={cancelEditMessage}
                                >
                                  <FaTimes size={10} />
                                </button>
                              </div>
                            ) : (
                              <div>{msg.text || msg.message}</div>
                            )}
                          </div>

                          <div
                            className="d-flex align-items-center gap-2 mt-1 px-1"
                            style={{ fontSize: "10.5px", color: "#64748b" }}
                          >
                            <span>
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                            {!isEditing && (
                              <>
                                <button
                                  className="btn btn-link p-0 text-muted"
                                  onClick={() => startEditMessage(msg)}
                                  title="Edit message"
                                >
                                  <FaPen size={9} />
                                </button>
                                <button
                                  className="btn btn-link p-0 text-danger"
                                  onClick={() => handleDeleteMessage(msg._id, true)}
                                  title="Delete message"
                                >
                                  <FaTrash size={9} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* USER GROUPS MODAL */}
      {groupsModalUser && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{
                background: "#0d1217",
                border: "1px solid #1a2430",
                borderRadius: "16px",
                color: "#f8fafc",
              }}
            >
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">Groups for {groupsModalUser.name}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeGroupsModal}
                />
              </div>
              <div className="modal-body">
                {getGroupsForUser(groupsModalUser).length === 0 ? (
                  <p className="text-muted text-center py-3">User is not in any groups currently loaded.</p>
                ) : (
                  getGroupsForUser(groupsModalUser).map((g) => (
                    <div
                      key={g._id}
                      className="d-flex justify-content-between align-items-center p-2 mb-2 rounded-2"
                      style={{ background: "#121820", border: "1px solid #1a2430" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={g.groupImage}
                          alt=""
                          style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                        />
                        <span className="fw-semibold">{g.groupName}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => goToGroupChatFromModal(g)}
                      >
                        View Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMonitor;
