import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const AllGroups = () => {
  const { token } = useSelector((state) => state.auth);

  const [groups, setGroups] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [memberCache, setMemberCache] = useState({});
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);

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

  // fallback: fetch a single user by id if they weren't in the bulk users list
  // (e.g. get-all-user is paginated/limited and doesn't include every user)
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
      }
    });
  };

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
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/remove-group-member`,
          { groupId: group._id, userId: memberId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
          title: "Removed",
          text: `${memberName} removed from group.`,
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });

        loadAll();
      } catch (error) {
        console.log(error);
        Swal.fire({
          title: "Error",
          text: "Could not remove member.",
          icon: "error",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
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
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/block-user`,
          { userId: memberId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
          title: "Blocked",
          text: `${memberName} has been blocked.`,
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });

        loadAll();
      } catch (error) {
        console.log(error);
        Swal.fire({
          title: "Error",
          text: "Could not block user.",
          icon: "error",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
      }
    });
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
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteGroup(group)}
                        >
                          Delete
                        </button>
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
                                    >
                                      Remove from Group
                                    </button>

                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleBlockMember(memberId)}
                                    >
                                      Block Permanently
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
    </div>
  );
};

export default AllGroups;