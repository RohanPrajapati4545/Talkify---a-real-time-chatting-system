import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { io } from "socket.io-client";

const USER_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 500;

const AllUsers = () => {
  const { token } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const requestIdRef = useRef(0);
  const isFirstSearchRef = useRef(true);

  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const socketRef = useRef(null);

  const fetchUsers = async (term, pageNum, append = false) => {
    const currentRequestId = ++requestIdRef.current;

    if (append) setLoadMoreLoading(true);
    else setLoading(true);

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
      setUsers((prev) => (append ? [...prev, ...list] : list));
      setHasMore(Boolean(res.data.pagination?.hasMore));
      setTotal(res.data.pagination?.total ?? list.length);
      setPage(pageNum);
    } catch (error) {
      console.log(error);
      if (!append) {
        setUsers([]);
        setTotal(0);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  };

  // initial load — page 1, no search term
  useEffect(() => {
    fetchUsers("", 1, false);
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
  // since the mount effect above already fetched page 1)
  useEffect(() => {
    if (isFirstSearchRef.current) {
      isFirstSearchRef.current = false;
      return;
    }
    fetchUsers(debouncedSearch, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleLoadMore = () => {
    if (loadMoreLoading || !hasMore) return;
    fetchUsers(debouncedSearch, page + 1, true);
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

        setUsers((prev) => prev.filter((u) => u._id !== user._id));
        setTotal((prev) => Math.max(0, prev - 1));

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

          {!loading && hasMore && (
            <div className="text-center mt-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={handleLoadMore}
                disabled={loadMoreLoading}
              >
                {loadMoreLoading ? "Loading..." : "Load more"}
              </button>
            </div>
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
    </div>
  );
};

export default AllUsers;