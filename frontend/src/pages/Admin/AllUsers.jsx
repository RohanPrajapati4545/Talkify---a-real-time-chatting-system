import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { io } from "socket.io-client";

const USER_LIMIT = 10;
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

const AllUsers = () => {
  const { token } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const requestIdRef = useRef(0);
  const isFirstSearchRef = useRef(true);

  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const socketRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(total / USER_LIMIT));

  const fetchUsers = async (term, pageNum) => {
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        {
          params: { search: term, page: pageNum, limit: USER_LIMIT },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ignore stale responses if a newer request has since been fired
      if (currentRequestId !== requestIdRef.current) return;

      const list = res.data.users || [];
      setUsers(list);
      setTotal(res.data.pagination?.total ?? list.length);
      setPage(pageNum);
    } catch (error) {
      console.log(error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // initial load — page 1, no search term
  useEffect(() => {
    fetchUsers("", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search input — 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // re-fetch whenever the debounced term changes (skip the very first run,
  // since the mount effect above already fetched page 1) — always resets
  // back to page 1
  useEffect(() => {
    if (isFirstSearchRef.current) {
      isFirstSearchRef.current = false;
      return;
    }
    fetchUsers(debouncedSearch, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (newPage === page || loading) return;
    fetchUsers(debouncedSearch, newPage);
  };

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

        Swal.fire({
          title: "Deleted",
          text: "User has been removed.",
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });

        // if this was the last item on the current page, step back a page
        const isLastItemOnPage = users.length === 1 && page > 1;
        fetchUsers(debouncedSearch, isLastItemOnPage ? page - 1 : page);
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
    setEditContact(user.contact || "");
    setEditImage(null);
    setEditImagePreview(user.image || "");
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditUser(null);
    setEditName("");
    setEditEmail("");
    setEditContact("");
    setEditImage(null);
    setEditImagePreview("");
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditImage(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("userId", editUser._id);
      formData.append("name", editName);
      formData.append("email", editEmail);
      formData.append("contact", editContact);
      if (editImage) formData.append("image", editImage);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/update-user`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
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

  // search is now server-side (debounced), so `users` already reflects the
  // current search term — no client-side filtering needed

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
          <span className="badge bg-dark px-3 py-2">{total} Users</span>
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
              {users.map((item) => {
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

          {!loading && users.length === 0 && (
            <div className="text-center py-4">No Users Found</div>
          )}

          {!loading && totalPages > 1 && (
            <nav className="d-flex justify-content-center align-items-center gap-1 mt-3 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() => handlePageChange(page - 1)}
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
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </div>

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
                        src={editImagePreview || editUser.image}
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
                      <label
                        htmlFor="editUserImageInput"
                        className="btn btn-sm btn-outline-warning mt-2 mb-0"
                      >
                        Change Photo
                      </label>
                      <input
                        id="editUserImageInput"
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={handleEditImageChange}
                        disabled={saving}
                      />
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

                    <div className="mb-3">
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

                    <div className="mb-1">
                      <label className="form-label admin-label">Contact</label>
                      <input
                      maxLength={10}
                       
                        className="form-control admin-input"
                        value={editContact}
                        onChange={(e) => setEditContact(e.target.value)}
                        placeholder="Phone number"
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
    </div>
  );
};

export default AllUsers;