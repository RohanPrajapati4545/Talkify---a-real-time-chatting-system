import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { FaArrowLeft, FaUserPlus, FaCrown } from "react-icons/fa";

const GroupMembers = () => {
  const { groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  // AllGroups.jsx se navigate karte time group + usersMap state mein bheja gaya tha —
  // isse fresh fetch nahi karna padta. Agar user seedha is URL pe aaya (refresh/direct link),
  // to state khaali hoga aur neeche fallback message dikhega.
  const [group, setGroup] = useState(location.state?.group || null);
  const [usersMap, setUsersMap] = useState(location.state?.usersMap || {});
  const [memberCache, setMemberCache] = useState({});
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const [missingMemberIds, setMissingMemberIds] = useState(new Set());
  const [memberActionId, setMemberActionId] = useState(null);

  // add member modal
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [addingMemberId, setAddingMemberId] = useState(null);

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

  // agar poori user directory state mein nahi mili (direct URL visit), to fetch kar lo
  useEffect(() => {
    if (Object.keys(usersMap).length > 0) return;

    const getUsers = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
          {
            params: { all: true },
            headers: { Authorization: `Bearer ${token}` },
          }
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

    getUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchMemberIfMissing = async (memberId) => {
    if (
      usersMap[memberId] ||
      memberCache[memberId] ||
      fetchingIds.has(memberId) ||
      missingMemberIds.has(memberId)
    )
      return;

    setFetchingIds((prev) => new Set(prev).add(memberId));

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-user/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMemberCache((prev) => ({ ...prev, [memberId]: res.data.user }));
    } catch (error) {
      if (error?.response?.status === 404) {
        setMissingMemberIds((prev) => new Set(prev).add(memberId));
      } else {
        console.log("Could not fetch member", memberId, error);
      }
    } finally {
      setFetchingIds((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!group) return;
    group.members?.forEach((memberId) => {
      if (!usersMap[memberId]) fetchMemberIfMissing(memberId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, usersMap]);

  const getMember = (memberId) => usersMap[memberId] || memberCache[memberId];

  const handleRemoveMember = (memberId) => {
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

        setGroup((prev) => ({
          ...prev,
          members: updatedGroup?.members ?? prev.members.filter((m) => m !== memberId),
          createdBy: updatedGroup?.createdBy ?? prev.createdBy,
        }));

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

  const handleMakeAdmin = (memberId) => {
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

        setGroup((prev) => ({
          ...prev,
          createdBy: updatedGroup?.createdBy ?? memberId,
        }));

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

  const handleAddMember = (user) => {
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

        setGroup((prev) => ({
          ...prev,
          members: [...(prev.members || []), user._id],
        }));

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


  if (!group) {
    return (
      <div className="dashboard-wrapper p-4">
        <div className="bg-white rounded-4 shadow-sm p-5 text-center">
          <p className="text-muted mb-3">
            Group details not found. Please open this page from the Groups list.
          </p>
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={() => navigate("/admin/groups")}
          >
            <FaArrowLeft size={11} className="me-1" />
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const availableUsers = Object.values(usersMap).filter((u) => {
    if ((group.members || []).includes(u._id)) return false;
    const q = addMemberSearch.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={11} className="me-1" />
            Back
          </button>

          <div className="d-flex align-items-center gap-2">
            <img
              src={group.groupImage}
              alt=""
              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
            />
            <div>
              <h2 className="fw-bold mb-0" style={{ fontSize: "20px" }}>
                {group.groupName}
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: "12.5px" }}>
                {group.members?.length ?? 0} members
              </p>
            </div>
          </div>
        </div>

        <button
          className="btn btn-sm btn-outline-success"
          onClick={() => setAddMemberOpen(true)}
        >
          <FaUserPlus size={11} className="me-1" />
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <h4 className="fw-bold mb-4">Members</h4>

        {(!group.members || group.members.length === 0) && (
          <div className="text-muted text-center py-4">No members in this group.</div>
        )}

        {group.members
          ?.filter((memberId) => !missingMemberIds.has(memberId))
          .map((memberId) => {
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
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      background: "var(--panel-2)",
                    }}
                  />
                  <div>
                    <div className="fw-semibold" style={{ fontSize: "13.5px" }}>
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

                <div className="d-flex gap-2 flex-wrap">
                  {!isCurrentAdmin && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleMakeAdmin(memberId)}
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
                    onClick={() => handleRemoveMember(memberId)}
                    disabled={isBusy}
                  >
                    {isBusy ? "..." : "Remove from Group"}
                  </button>

                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleBlockMember(memberId)}
                    disabled={isBusy || member?.isBlocked}
                  >
                    {isBusy ? "..." : member?.isBlocked ? "Blocked" : "Block Permanently"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {addMemberOpen && (
        <>
          <div
            className="modal fade show d-block admin-edit-modal"
            tabIndex="-1"
            role="dialog"
            onClick={() => setAddMemberOpen(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Add Member — {group.groupName}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setAddMemberOpen(false)}
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

                  {availableUsers.length === 0 ? (
                    <div className="text-center text-muted py-3">No matching users to add.</div>
                  ) : (
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
                                    <span className="badge bg-danger ms-2" style={{ fontSize: "9px" }}>
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
                              onClick={() => handleAddMember(user)}
                              disabled={isBusy || user.isBlocked}
                              title={user.isBlocked ? "Blocked users can't be added" : "Add to group"}
                            >
                              {isBusy ? "..." : "Add"}
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
                    onClick={() => setAddMemberOpen(false)}
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

export default GroupMembers;