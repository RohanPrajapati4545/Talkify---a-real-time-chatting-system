import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import { FaComments, FaPen, FaTrash, FaArrowLeft } from "react-icons/fa";

const AllUsers = () => {
  const { token } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  // ============== CHATS MODAL STATE ==============
  const [chatUser, setChatUser] = useState(null); // the user whose chats we're viewing
  const [chatView, setChatView] = useState("list"); // "list" | "messages"
  const [userChats, setUserChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatActionId, setChatActionId] = useState(null); // clearing/deleting a chat from the list

  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [editingMessageImage, setEditingMessageImage] = useState(null);
  const [editingMessageImagePreview, setEditingMessageImagePreview] = useState("");
  const [messageActionId, setMessageActionId] = useState(null);
  const [clearingChat, setClearingChat] = useState(false);

  const socketRef = useRef(null);

  const getUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.users);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = io(process.env.REACT_APP_API_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("onlineUsers", (ids) => {
      setOnlineUserIds(ids || []);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const isUserOnline = (userId) => onlineUserIds.includes(userId);

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

  const handleBlockToggle = (user) => {
    const isBlocked = user.isBlocked;
    const action = isBlocked ? "unblock" : "block";

    Swal.fire({
      title: "Are you sure?",
      text: `You want to ${action} ${user.name}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      background: "#1c1812",
      color: "#f2ece2",
      confirmButtonColor: "#e8a33d",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setActionLoadingId(user._id);

        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/${action}-user`,
          { userId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, isBlocked: res.data.user?.isBlocked ?? !isBlocked } : u
          )
        );

        Swal.fire({
          title: "Done",
          text: `User ${action}ed successfully.`,
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, `Could not ${action} user.`);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleDelete = (user) => {
    Swal.fire({
      title: "Delete User?",
      text: `This will permanently delete ${user.name}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setActionLoadingId(user._id);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/delete-user`,
          { userId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers((prev) => prev.filter((u) => u._id !== user._id));

        Swal.fire({
          title: "Deleted",
          text: "User has been removed.",
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not delete user.");
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditUser(null);
    setEditName("");
    setEditEmail("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/update-user`,
        { userId: editUser._id, name: editName, email: editEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = res.data.user;

      setUsers((prev) =>
        prev.map((u) => (u._id === editUser._id ? { ...u, ...updatedUser } : u))
      );

      Swal.fire({
        title: "Updated",
        text: "User details updated successfully.",
        icon: "success",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });

      closeEditModal();
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not update user.");
    } finally {
      setSaving(false);
    }
  };

  // ============== CHATS: LIST OF CONVERSATIONS ==============

  const getOtherMember = (chat) => {
    if (!chatUser) return null;
    return chat.members?.find((m) => m._id !== chatUser._id) || null;
  };

  const openChatsModal = async (user) => {
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

  const closeChatsModal = () => {
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

  // ============== MESSAGE EDIT / DELETE ==============

  const startEditMessage = (msg) => {
    setEditingMessageId(msg._id);
    setEditingMessageText(msg.message || "");
    setEditingMessageImage(null);
    setEditingMessageImagePreview(msg.mediaType === "image" ? msg.media : "");
  };

  const cancelEditMessage = () => {
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
    try {
      setMessageActionId(msg._id);

      const formData = new FormData();
      formData.append("messageId", msg._id);
      formData.append("message", editingMessageText);
      if (editingMessageImage) formData.append("image", editingMessageImage);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/edit-private-message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updated = res.data.message;

      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, ...updated } : m))
      );

      cancelEditMessage();
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not update message.");
    } finally {
      setMessageActionId(null);
    }
  };

  const handleDeleteMessage = (msg) => {
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
          `${process.env.REACT_APP_API_URL}/api/admin/delete-private-message`,
          { messageId: msg._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not delete message.");
      } finally {
        setMessageActionId(null);
      }
    });
  };

  const handleClearOpenChat = () => {
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

  // Renders the media attached to a private message (image / video / audio)
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

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">All Users</h2>
          <p className="text-muted mb-0">Manage registered users</p>
        </div>

        <input
          type="text"
          className="form-control admin-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "280px" }}
        />
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold m-0">Users</h4>
          <span className="badge bg-dark px-3 py-2">{filteredUsers.length} Users</span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Account</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((item) => {
                const online = isUserOnline(item._id);
                const isRowBusy = actionLoadingId === item._id;

                return (
                  <tr key={item._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar-status-wrap">
                          <img
                            src={`${item.image}`}
                            alt=""
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <span className={`status-dot ${online ? "online" : "offline"}`} />
                        </div>
                        <span className="fw-semibold">{item.name}</span>
                      </div>
                    </td>

                    <td>{item.email}</td>

                    <td>
                      {online ? (
                        <span className="badge bg-success">Online</span>
                      ) : (
                        <span className="badge bg-secondary">Offline</span>
                      )}
                    </td>

                    <td>
                      {item.isBlocked ? (
                        <span className="badge bg-danger">Blocked</span>
                      ) : (
                        <span className="badge bg-success">Active</span>
                      )}
                    </td>

                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => openEditModal(item)}
                          disabled={isRowBusy}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => openChatsModal(item)}
                          disabled={isRowBusy}
                          title="View this user's chats"
                        >
                          <FaComments size={11} className="me-1" />
                          Chats
                        </button>

                        <button
                          className={`btn btn-sm ${
                            item.isBlocked ? "btn-outline-warning" : "btn-outline-danger"
                          }`}
                          onClick={() => handleBlockToggle(item)}
                          disabled={isRowBusy}
                        >
                          {isRowBusy ? "..." : item.isBlocked ? "Unblock" : "Block"}
                        </button>

                        <button
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => handleDelete(item)}
                          disabled={isRowBusy}
                        >
                          {isRowBusy ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-4">No Users Found</div>
          )}
        </div>
      </div>

      {/* ============== BOOTSTRAP EDIT MODAL ============== */}
      {editUser && (
        <>
          <div
            className="modal fade show d-block admin-edit-modal"
            tabIndex="-1"
            role="dialog"
            onClick={closeEditModal}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEditModal}
                    disabled={saving}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="avatar-status-wrap">
                      <img
                        src={editUser.image}
                        alt=""
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid var(--hairline)",
                        }}
                      />
                      <span
                        className={`status-dot ${
                          isUserOnline(editUser._id) ? "online" : "offline"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="fw-semibold">{editUser.name}</div>
                      <div className="text-muted" style={{ fontSize: "12.5px" }}>
                        {isUserOnline(editUser._id) ? "Online" : "Offline"}
                      </div>
                    </div>
                  </div>

                  <form id="editUserForm" onSubmit={handleEditSubmit}>
                    <div className="mb-3">
                      <label className="form-label admin-label">Name</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="mb-1">
                      <label className="form-label admin-label">Email</label>
                      <input
                        type="email"
                        className="form-control admin-input"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={closeEditModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="editUserForm"
                    className="btn btn-warning btn-sm"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* ============== CHATS MODAL (list of conversations -> messages) ============== */}
      {chatUser && (
        <>
          <div
            className="modal fade show d-block admin-edit-modal chats-modal"
            tabIndex="-1"
            role="dialog"
            onClick={closeChatsModal}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-lg"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <div className="d-flex align-items-center gap-2">
                    {chatView === "messages" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark me-1"
                        onClick={backToChatList}
                        title="Back to conversations"
                      >
                        <FaArrowLeft size={11} />
                      </button>
                    )}
                    <img
                      src={
                        chatView === "messages"
                          ? getOtherMember(selectedChat)?.image
                          : chatUser.image
                      }
                      alt=""
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <h5 className="modal-title fw-bold m-0">
                      {chatView === "messages"
                        ? `${chatUser.name} ↔ ${getOtherMember(selectedChat)?.name || "Unknown"}`
                        : `${chatUser.name} — Conversations`}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeChatsModal}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body chats-modal-body">
                  {/* ---------- LIST VIEW ---------- */}
                  {chatView === "list" && (
                    <>
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

                  {/* ---------- MESSAGES VIEW ---------- */}
                  {chatView === "messages" && (
                    <>
                      {loadingMessages && (
                        <div className="text-center text-muted py-4">Loading messages...</div>
                      )}

                      {!loadingMessages && messages.length === 0 && (
                        <div className="text-center text-muted py-4">
                          No messages in this conversation yet.
                        </div>
                      )}

                      {!loadingMessages &&
                        messages.map((msg) => {
                          const isEditing = editingMessageId === msg._id;
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
                                    {msg.createdAt
                                      ? new Date(msg.createdAt).toLocaleString()
                                      : ""}
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
                                        htmlFor={`editPrivMsgImage-${msg._id}`}
                                        className="btn btn-sm btn-outline-warning mb-0"
                                      >
                                        {editingMessageImagePreview ? "Change Image" : "Add Image"}
                                      </label>
                                      <input
                                        id={`editPrivMsgImage-${msg._id}`}
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
                                    onClick={() => startEditMessage(msg)}
                                    disabled={isBusy}
                                    title="Edit message"
                                  >
                                    <FaPen size={11} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteMessage(msg)}
                                    disabled={isBusy}
                                    title="Delete message"
                                  >
                                    <FaTrash size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </>
                  )}
                </div>

                <div className="modal-footer d-flex justify-content-between">
                  {chatView === "messages" ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleClearOpenChat}
                      disabled={clearingChat || messages.length === 0}
                    >
                      <FaTrash size={11} className="me-1" />
                      {clearingChat ? "Clearing..." : "Clear All Chat"}
                    </button>
                  ) : (
                    <span className="text-muted" style={{ fontSize: "12px" }}>
                      {userChats.length} conversation{userChats.length === 1 ? "" : "s"}
                    </span>
                  )}

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={closeChatsModal}
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

export default AllUsers;