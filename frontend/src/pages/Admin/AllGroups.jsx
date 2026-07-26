import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaPen, FaEye } from "react-icons/fa";

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

const AllGroups = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [groupPage, setGroupPage] = useState(1);
  const groupRequestIdRef = useRef(0);
  const isFirstSearchRef = useRef(true);

  const [usersMap, setUsersMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // edit group modal
  const [editGroup, setEditGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupImage, setEditGroupImage] = useState(null);
  const [editGroupPreview, setEditGroupPreview] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const totalGroupPages = Math.max(1, Math.ceil(totalGroups / GROUP_LIMIT));

  const fetchGroups = async (term, page) => {
    const currentRequestId = ++groupRequestIdRef.current;

    setLoading(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-group`,
        {
          params: { search: term, page, limit: GROUP_LIMIT },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ignore stale responses if a newer request has since been fired
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
      setLoading(false);
    }
  };

  const getUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        {
          params: { all: true }, // full directory — not paginated
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

  useEffect(() => {
    fetchGroups("", 1);
    getUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (isFirstSearchRef.current) {
      isFirstSearchRef.current = false;
      return;
    }
    // reset to page 1 whenever the search term changes
    fetchGroups(debouncedSearch, 1);
  }, [debouncedSearch]);

  const handleGroupPageChange = (newPage) => {
    if (newPage < 1 || newPage > totalGroupPages) return;
    if (newPage === groupPage || loading) return;
    fetchGroups(debouncedSearch, newPage);
  };

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

  const getMember = (memberId) => usersMap[memberId];

  const handleViewMembers = (group) => {
    navigate(`/admin/groups/${group._id}/members`, {
      state: { group, usersMap },
    });
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

        // if this was the last item on the current page, step back a page
        const isLastItemOnPage = groups.length === 1 && groupPage > 1;
        fetchGroups(debouncedSearch, isLastItemOnPage ? groupPage - 1 : groupPage);
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not delete group.");
      }
    });
  };

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

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">All Groups</h2>
          <p className="text-muted mb-0">Manage active groups and their members</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <input
            type="text"
            className="form-control admin-search"
            placeholder="Search by group name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "280px" }}
          />
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold m-0">Groups</h4>
          <span className="badge bg-dark px-3 py-2">{totalGroups} Groups</span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Group</th>
                <th>Created By</th>
                <th>Members</th>
                <th>Created On</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {groups.map((group) => {
                const creator = getMember(group.createdBy);

                return (
                  <tr key={group._id}>
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

                    <td>{group.members?.length ?? 0}</td>

                    <td>
                      {group.createdAt
                        ? new Date(group.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewMembers(group)}
                          title="View group members"
                        >
                          <FaEye size={11} className="me-1" />
                          View
                        </button>

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
                );
              })}
            </tbody>
          </table>

          {!loading && groups.length === 0 && (
            <div className="text-center py-4">No Groups Found</div>
          )}

          {!loading && totalGroupPages > 1 && (
            <nav className="d-flex justify-content-center align-items-center gap-1 mt-3 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() => handleGroupPageChange(groupPage - 1)}
                disabled={groupPage === 1}
              >
                Prev
              </button>

              {renderPageNumbers(groupPage, totalGroupPages).map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${
                      p === groupPage ? "btn-warning" : "btn-outline-dark"
                    }`}
                    onClick={() => handleGroupPageChange(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() => handleGroupPageChange(groupPage + 1)}
                disabled={groupPage === totalGroupPages}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default AllGroups;