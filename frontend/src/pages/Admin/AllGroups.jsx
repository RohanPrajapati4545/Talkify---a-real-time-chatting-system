import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { FaChevronDown, FaChevronUp, FaPen, FaTrash, FaComments } from "react-icons/fa";

const AllGroups = () => {
  const { token } = useSelector((state) => state.auth);

  const [groups, setGroups] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [memberCache, setMemberCache] = useState({});
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [memberActionId, setMemberActionId] = useState(null);

  // edit group modal
  const [editGroup, setEditGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupImage, setEditGroupImage] = useState(null);
  const [editGroupPreview, setEditGroupPreview] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  // chats modal
  const [chatGroup, setChatGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [editingMessageImage, setEditingMessageImage] = useState(null);
  const [editingMessageImagePreview, setEditingMessageImagePreview] = useState("");
  const [messageActionId, setMessageActionId] = useState(null);
  const [clearingChat, setClearingChat] = useState(false);

  const getGroups = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-group`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(res.data.groups || []);
    } catch (error) {
      console.log(error);
    }
  };

  const getUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const map = {};
      (res.data.users || []).forEach((u) => {
        map[u._id] = u;
      });
      setUsersMap(map);
    } catch (error) {
      console.log(error);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([getGroups(), getUsers()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
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

  const fetchMemberIfMissing = async (memberId) => {
    if (usersMap[memberId] || memberCache[memberId] || fetchingIds.has(memberId)) return;

    setFetchingIds((prev) => new Set(prev).add(memberId));

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-user/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMemberCache((prev) => ({ ...prev, [memberId]: res.data.user }));
    } catch (error) {
      console.log("Could not fetch member", memberId, error);
    } finally {
      setFetchingIds((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const getMember = (memberId) => usersMap[memberId] || memberCache[memberId];

  const toggleExpand = (group) => {
    const groupId = group._id;
    const willOpen = expandedGroup !== groupId;

    setExpandedGroup(willOpen ? groupId : null);

    if (willOpen) {
      group.members?.forEach((memberId) => {
        if (!usersMap[memberId]) fetchMemberIfMissing(memberId);
      });
    }
  };

  // ============== DELETE GROUP ==============

  const handleDeleteGroup = (group) => {
    Swal.fire({
      title: "Delete Group?",
      text: `This will permanently delete "${group.groupName}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/delete-group`,
          { groupId: group._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
          title: "Deleted",
          text: "Group has been removed.",
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });

        loadAll();
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not delete group.");
      }
    });
  };

  // ============== REMOVE MEMBER / BLOCK ==============

  const handleRemoveMember = (group, memberId) => {
    const member = getMember(memberId);
    const memberName = member?.name || "this user";

    Swal.fire({
      title: "Remove Member?",
      text: `Remove ${memberName} from "${group.groupName}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      confirmButtonColor: "#e8a33d",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setMemberActionId(memberId);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/remove-group-member`,
          { groupId: group._id, userId: memberId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setGroups((prev) =>
          prev.map((g) =>
            g._id === group._id
              ? { ...g, members: g.members.filter((m) => m !== memberId) }
              : g
          )
        );

        Swal.fire({
          title: "Removed",
          text: `${memberName} removed from group.`,
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not remove member.");
      } finally {
        setMemberActionId(null);
      }
    });
  };

  const handleBlockMember = (memberId) => {
    const member = getMember(memberId);
    const memberName = member?.name || "this user";

    Swal.fire({
      title: "Block User Permanently?",
      text: `${memberName} will be blocked from the entire platform, not just this group.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, block",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setMemberActionId(memberId);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/block-user`,
          { userId: memberId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsersMap((prev) => ({
          ...prev,
          [memberId]: { ...prev[memberId], isBlocked: true },
        }));
        setMemberCache((prev) =>
          prev[memberId] ? { ...prev, [memberId]: { ...prev[memberId], isBlocked: true } } : prev
        );

        Swal.fire({
          title: "Blocked",
          text: `${memberName} has been blocked.`,
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not block user.");
      } finally {
        setMemberActionId(null);
      }
    });
  };

  // ============== EDIT GROUP (name + photo) ==============

  const openEditGroup = (group) => {
    setEditGroup(group);
    setEditGroupName(group.groupName || "");
    setEditGroupImage(null);
    setEditGroupPreview(group.groupImage || "");
  };

  const closeEditGroup = () => {
    if (savingGroup) return;
    setEditGroup(null);
    setEditGroupName("");
    setEditGroupImage(null);
    setEditGroupPreview("");
  };

  const handleGroupImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditGroupImage(file);
    setEditGroupPreview(URL.createObjectURL(file));
  };

  const handleEditGroupSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingGroup(true);

      const formData = new FormData();
      formData.append("groupId", editGroup._id);
      formData.append("groupName", editGroupName);
      if (editGroupImage) formData.append("image", editGroupImage);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/update-group`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedGroup = res.data.group;

      setGroups((prev) =>
        prev.map((g) => (g._id === editGroup._id ? { ...g, ...updatedGroup } : g))
      );

      Swal.fire({
        title: "Updated",
        text: "Group details updated successfully.",
        icon: "success",
        background: "#1c1812",
        color: "#f2ece2",
        confirmButtonColor: "#e8a33d",
      });

      closeEditGroup();
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not update group.");
    } finally {
      setSavingGroup(false);
    }
  };

  // ============== VIEW / MODERATE CHATS ==============

  const openChatsModal = async (group) => {
    setChatGroup(group);
    setLoadingMessages(true);
    setMessages([]);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-group-messages/${group._id}`,
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

  const closeChatsModal = () => {
    setChatGroup(null);
    setMessages([]);
    setEditingMessageId(null);
    setEditingMessageText("");
  };

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
        `${process.env.REACT_APP_API_URL}/api/admin/edit-group-message`,
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

  // ============== CLEAR ALL CHAT ==============

  const handleClearChat = () => {
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
          `${process.env.REACT_APP_API_URL}/api/admin/delete-group-message`,
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

  // Renders the media attached to a message (image / video / audio),
  // falling back to nothing if the message has no media.
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
      return (
        <video
          src={msg.media}
          controls
          style={{ ...commonStyle, background: "#000" }}
        />
      );
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

    // mediaType missing/unknown but a media URL exists — still give admin a link
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

  const filteredGroups = groups.filter((g) =>
    g.groupName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">All Groups</h2>
          <p className="text-muted mb-0">Manage active groups and their members</p>
        </div>

        <input
          type="text"
          className="form-control admin-search"
          placeholder="Search by group name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "280px" }}
        />
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold m-0">Groups</h4>
          <span className="badge bg-dark px-3 py-2">{filteredGroups.length} Groups</span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th></th>
                <th>Group</th>
                <th>Created By</th>
                <th>Members</th>
                <th>Created On</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredGroups.map((group) => {
                const isOpen = expandedGroup === group._id;
                const creator = getMember(group.createdBy);

                return (
                  <React.Fragment key={group._id}>
                    <tr>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-dark expand-toggle"
                          onClick={() => toggleExpand(group)}
                        >
                          {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                        </button>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={group.groupImage}
                            alt=""
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <span className="fw-semibold">{group.groupName}</span>
                        </div>
                      </td>

                      <td>{creator?.name || "Loading..."}</td>

                      <td>
                        <span className="clickable" onClick={() => toggleExpand(group)}>
                          {group.members?.length ?? 0}
                        </span>
                      </td>

                      <td>
                        {group.createdAt
                          ? new Date(group.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => openEditGroup(group)}
                            title="Edit group name/photo"
                          >
                            <FaPen size={11} className="me-1" />
                            Edit
                          </button>

                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => openChatsModal(group)}
                            title="View group chats"
                          >
                            <FaComments size={11} className="me-1" />
                            Chats
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteGroup(group)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="members-row">
                        <td colSpan={6}>
                          <div className="members-panel">
                            {(!group.members || group.members.length === 0) && (
                              <div className="text-muted py-2">No members in this group.</div>
                            )}

                            {group.members?.map((memberId) => {
                              const member = getMember(memberId);
                              const isFetching = fetchingIds.has(memberId);
                              const isBusy = memberActionId === memberId;

                              return (
                                <div className="member-row" key={memberId}>
                                  <div className="d-flex align-items-center gap-2">
                                    <img
                                      src={member?.image}
                                      alt=""
                                      style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        background: "var(--panel-2)",
                                      }}
                                    />
                                    <div>
                                      <div className="fw-semibold" style={{ fontSize: "13px" }}>
                                        {member?.name || (isFetching ? "Loading..." : "Unknown user")}
                                        {memberId === group.createdBy && (
                                          <span className="badge bg-dark ms-2" style={{ fontSize: "9px" }}>
                                            Admin
                                          </span>
                                        )}
                                        {member?.isBlocked && (
                                          <span className="badge bg-danger ms-2" style={{ fontSize: "9px" }}>
                                            Blocked
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-muted" style={{ fontSize: "11.5px" }}>
                                        {member?.email || memberId}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-sm btn-outline-warning"
                                      onClick={() => handleRemoveMember(group, memberId)}
                                      disabled={isBusy}
                                    >
                                      {isBusy ? "..." : "Remove from Group"}
                                    </button>

                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleBlockMember(memberId)}
                                      disabled={isBusy || member?.isBlocked}
                                    >
                                      {isBusy
                                        ? "..."
                                        : member?.isBlocked
                                        ? "Blocked"
                                        : "Block Permanently"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {!loading && filteredGroups.length === 0 && (
            <div className="text-center py-4">No Groups Found</div>
          )}
        </div>
      </div>

      {/* ============== EDIT GROUP MODAL ============== */}
      {editGroup && (
        <>
          <div
            className="modal fade show d-block admin-edit-modal"
            tabIndex="-1"
            role="dialog"
            onClick={closeEditGroup}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Edit Group</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEditGroup}
                    disabled={savingGroup}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <img
                      src={editGroupPreview}
                      alt=""
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid var(--hairline)",
                      }}
                    />
                    <div>
                      <label htmlFor="groupImageInput" className="btn btn-sm btn-outline-warning mb-0">
                        Change Photo
                      </label>
                      <input
                        id="groupImageInput"
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={handleGroupImageChange}
                        disabled={savingGroup}
                      />
                    </div>
                  </div>

                  <form id="editGroupForm" onSubmit={handleEditGroupSubmit}>
                    <div className="mb-1">
                      <label className="form-label admin-label">Group Name</label>
                      <input
                        type="text"
                        className="form-control admin-input"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        required
                        disabled={savingGroup}
                      />
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={closeEditGroup}
                    disabled={savingGroup}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="editGroupForm"
                    className="btn btn-warning btn-sm"
                    disabled={savingGroup}
                  >
                    {savingGroup ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* ============== CHATS MODAL ============== */}
      {chatGroup && (
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
                    <img
                      src={chatGroup.groupImage}
                      alt=""
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <h5 className="modal-title fw-bold m-0">
                      {chatGroup.groupName} — Chat Log
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
                  {loadingMessages && (
                    <div className="text-center text-muted py-4">Loading messages...</div>
                  )}

                  {!loadingMessages && messages.length === 0 && (
                    <div className="text-center text-muted py-4">No messages in this group yet.</div>
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
                </div>

                <div className="modal-footer d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleClearChat}
                    disabled={clearingChat || messages.length === 0}
                  >
                    <FaTrash size={11} className="me-1" />
                    {clearingChat ? "Clearing..." : "Clear All Chat"}
                  </button>

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

export default AllGroups;