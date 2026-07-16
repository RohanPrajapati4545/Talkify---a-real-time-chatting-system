import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { FaChevronDown, FaChevronUp, FaPen, FaUserPlus, FaCrown } from "react-icons/fa";

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

  // add member modal
  const [addMemberGroup, setAddMemberGroup] = useState(null);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [addingMemberId, setAddingMemberId] = useState(null);

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
  // If the removed member is the current group admin (createdBy), the backend
  // automatically promotes the next member as the new admin. The group is
  // never deleted here — backend rejects removal if the admin is the only
  // member left, so we warn the user upfront instead of firing a request
  // that will fail.

  const handleRemoveMember = (group, memberId) => {
    const member = getMember(memberId);
    const memberName = member?.name || "this user";
    const isAdmin = group.createdBy === memberId;
    const onlyMemberLeft = isAdmin && (group.members || []).length === 1;

    Swal.fire({
      title: onlyMemberLeft ? "Cannot Remove" : "Remove Member?",
      text: onlyMemberLeft
        ? `${memberName} is the only member and the group admin. Add another member first, or delete the group instead.`
        : isAdmin
        ? `${memberName} is the group admin. Removing them will automatically make the next member the new admin. Group will not be deleted.`
        : `Remove ${memberName} from "${group.groupName}".`,
      icon: "warning",
      showCancelButton: !onlyMemberLeft,
      confirmButtonText: onlyMemberLeft ? "OK" : "Yes, remove",
      confirmButtonColor: "#e8a33d",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (onlyMemberLeft || !result.isConfirmed) return;

      try {
        setMemberActionId(memberId);

        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/remove-group-member`,
          { groupId: group._id, userId: memberId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedGroup = res.data.group;

        setGroups((prev) =>
          prev.map((g) =>
            g._id === group._id
              ? {
                  ...g,
                  members: updatedGroup?.members ?? g.members.filter((m) => m !== memberId),
                  createdBy: updatedGroup?.createdBy ?? g.createdBy,
                }
              : g
          )
        );

        Swal.fire({
          title: "Removed",
          text:
            isAdmin && updatedGroup
              ? `${memberName} removed. ${
                  getMember(updatedGroup.createdBy)?.name || "The next member"
                } is now the group admin.`
              : `${memberName} removed from group.`,
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

  // ============== MAKE ADMIN (transfer ownership) ==============
  // Admin status is derived from group.createdBy, so making someone the
  // new admin automatically demotes the old admin to a regular member —
  // no separate "role" field needs to change.

  const handleMakeAdmin = (group, memberId) => {
    const member = getMember(memberId);
    const memberName = member?.name || "this user";
    const currentAdmin = getMember(group.createdBy);

    Swal.fire({
      title: "Make Admin?",
      text: `${memberName} will become the new admin of "${group.groupName}". ${
        currentAdmin?.name || "The current admin"
      } will become a regular member.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, make admin",
      confirmButtonColor: "#e8a33d",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setMemberActionId(memberId);

        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/change-group-admin`,
          { groupId: group._id, newAdminId: memberId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedGroup = res.data.group;

        setGroups((prev) =>
          prev.map((g) =>
            g._id === group._id ? { ...g, createdBy: updatedGroup?.createdBy ?? memberId } : g
          )
        );

        Swal.fire({
          title: "Admin Changed",
          text: `${memberName} is now the group admin.`,
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not change admin.");
      } finally {
        setMemberActionId(null);
      }
    });
  };

  // ============== ADD MEMBER ==============

  const openAddMemberModal = (group) => {
    setAddMemberGroup(group);
    setAddMemberSearch("");
  };

  const closeAddMemberModal = () => {
    setAddMemberGroup(null);
    setAddMemberSearch("");
  };

  const handleAddMember = (group, user) => {
    Swal.fire({
      title: "Add Member?",
      text: `Add ${user.name} to "${group.groupName}".`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, add",
      confirmButtonColor: "#e8a33d",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setAddingMemberId(user._id);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/add-group-member`,
          { groupId: group._id, userId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setGroups((prev) =>
          prev.map((g) =>
            g._id === group._id
              ? { ...g, members: [...(g.members || []), user._id] }
              : g
          )
        );

        Swal.fire({
          title: "Added",
          text: `${user.name} added to group.`,
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not add member.");
      } finally {
        setAddingMemberId(null);
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
                            <div className="d-flex justify-content-end mb-2">
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => openAddMemberModal(group)}
                              >
                                <FaUserPlus size={11} className="me-1" />
                                Add Member
                              </button>
                            </div>

                            {(!group.members || group.members.length === 0) && (
                              <div className="text-muted py-2">No members in this group.</div>
                            )}

                            {group.members?.map((memberId) => {
                              const member = getMember(memberId);
                              const isFetching = fetchingIds.has(memberId);
                              const isBusy = memberActionId === memberId;
                              const isCurrentAdmin = memberId === group.createdBy;

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
                                        {isCurrentAdmin && (
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
                                    {!isCurrentAdmin && (
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleMakeAdmin(group, memberId)}
                                        disabled={isBusy || member?.isBlocked}
                                        title="Make this user the group admin"
                                      >
                                        {isBusy ? "..." : (
                                          <>
                                            <FaCrown size={11} className="me-1" />
                                            Make Admin
                                          </>
                                        )}
                                      </button>
                                    )}

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

      {/* ============== ADD MEMBER MODAL ============== */}
      {addMemberGroup && (
        <>
          <div
            className="modal fade show d-block admin-edit-modal"
            tabIndex="-1"
            role="dialog"
            onClick={closeAddMemberModal}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    Add Member — {addMemberGroup.groupName}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeAddMemberModal}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control admin-input mb-3"
                    placeholder="Search by name or email..."
                    value={addMemberSearch}
                    onChange={(e) => setAddMemberSearch(e.target.value)}
                    autoFocus
                  />

                  {(() => {
                    const currentGroup =
                      groups.find((g) => g._id === addMemberGroup._id) || addMemberGroup;
                    const currentMembers = currentGroup.members || [];

                    const availableUsers = Object.values(usersMap).filter((u) => {
                      if (currentMembers.includes(u._id)) return false;
                      const q = addMemberSearch.toLowerCase();
                      return (
                        !q ||
                        u.name?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q)
                      );
                    });

                    if (availableUsers.length === 0) {
                      return (
                        <div className="text-center text-muted py-3">
                          No matching users to add.
                        </div>
                      );
                    }

                    return (
                      <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                        {availableUsers.map((user) => {
                          const isBusy = addingMemberId === user._id;

                          return (
                            <div className="member-row" key={user._id}>
                              <div className="d-flex align-items-center gap-2">
                                <img
                                  src={user.image}
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
                                    {user.name}
                                    {user.isBlocked && (
                                      <span
                                        className="badge bg-danger ms-2"
                                        style={{ fontSize: "9px" }}
                                      >
                                        Blocked
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-muted" style={{ fontSize: "11.5px" }}>
                                    {user.email}
                                  </div>
                                </div>
                              </div>

                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleAddMember(currentGroup, user)}
                                disabled={isBusy || user.isBlocked}
                                title={user.isBlocked ? "Blocked users can't be added" : "Add to group"}
                              >
                                {isBusy ? "..." : "Add"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={closeAddMemberModal}
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