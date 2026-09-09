import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaPhoneAlt, FaVideo, FaUsers, FaUser, FaTrash } from "react-icons/fa";

const API_BASE_URL = process.env.REACT_APP_API_URL;
const CALL_LIMIT = 20;

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

const AllCallRecords = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const [search, setSearch] = useState("");
  const [callType, setCallType] = useState(""); // "" | "video" | "audio"
  const [scope, setScope] = useState("");       // "" | "group" | "private"
  const [deletingId, setDeletingId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(totalCalls / CALL_LIMIT));

  const fetchCalls = useCallback(
    async (pageNum = 1) => {
      setLoading(true);

      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_BASE_URL}/api/admin/call-records`, {
          params: { page: pageNum, limit: CALL_LIMIT, search, callType, scope },
          headers: { Authorization: `Bearer ${token}` },
        });

        setCalls(data.calls || []);
        setTotalCalls(data.pagination?.total ?? (data.calls || []).length);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to fetch call records:", err);
        setCalls([]);
        setTotalCalls(0);
      } finally {
        setLoading(false);
      }
    },
    [search, callType, scope]
  );

  useEffect(() => {
    fetchCalls(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, callType, scope]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (newPage === page || loading) return;
    fetchCalls(newPage);
  };

  const handleDelete = async (callId) => {
    const result = await Swal.fire({
      title: "Delete this call record?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setDeletingId(callId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/admin/call-records`, {
        data: { callId },
        headers: { Authorization: `Bearer ${token}` },
      });

      // If this was the last row on the current page (and not page 1),
      // step back a page so the table doesn't show an empty page.
      const isLastRowOnPage = calls.length === 1 && page > 1;
      if (isLastRowOnPage) {
        fetchCalls(page - 1);
      } else {
        setCalls((prev) => prev.filter((c) => c._id !== callId));
        setTotalCalls((prev) => Math.max(0, prev - 1));
      }

      Swal.fire({
        title: "Deleted",
        text: "The call record has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to delete call record:", err);
      Swal.fire({
        title: "Failed",
        text: "Failed to delete call record. Please try again.",
        icon: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadgeClass = (status) => {
    if (status === "missed" || status === "rejected") return "bg-danger";
    if (status === "completed" || status === "answered") return "bg-success";
    return "bg-secondary";
  };

  const formatDuration = (seconds) => {
    if (seconds === undefined || seconds === null) return "—";
    const s = Number(seconds);
    if (Number.isNaN(s) || s <= 0) return "—";
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}m ${r}s`;
  };

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Call Records</h2>
          <p className="text-muted mb-0">All video &amp; audio calls across users and groups</p>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <button
            className={`btn btn-sm ${scope === "" ? "btn-warning" : "btn-outline-dark"}`}
            onClick={() => setScope("")}
          >
            All Chats
          </button>
          <button
            className={`btn btn-sm ${scope === "group" ? "btn-warning" : "btn-outline-dark"}`}
            onClick={() => setScope("group")}
          >
            <FaUsers size={11} className="me-1" />
            Group Calls
          </button>
          <button
            className={`btn btn-sm ${scope === "private" ? "btn-warning" : "btn-outline-dark"}`}
            onClick={() => setScope("private")}
          >
            <FaUser size={11} className="me-1" />
            Private Calls
          </button>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold m-0">All Calls</h5>

          <div className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="form-control admin-search"
              placeholder="Search by user or group name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: "240px" }}
            />

            <select
              className="form-select admin-search"
              style={{ maxWidth: "150px" }}
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>
        </div>

        {loading && <div className="text-center text-muted py-4">Loading call records...</div>}

        {!loading && calls.length === 0 && (
          <div className="text-center text-muted py-4">No call records found.</div>
        )}

        {!loading && calls.length > 0 && (
          <div className="table-responsive">
            <table className="table align-middle admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ minWidth: "220px" }}>Participant</th>
                  <th style={{ width: "100px" }}>Scope</th>
                  <th style={{ width: "110px" }}>Type</th>
                  <th style={{ minWidth: "160px" }}>Started by</th>
                  <th style={{ width: "110px" }}>Status</th>
                  <th style={{ width: "100px" }}>Duration</th>
                  <th style={{ minWidth: "170px" }}>Date &amp; time</th>
                  <th style={{ width: "70px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => {
                  const isGroup = Boolean(c.group);
                  const avatarSrc = isGroup ? c.group?.groupImage : c.receiver?.image;
                  const participantName = isGroup
                    ? c.group?.groupName || "Unnamed group"
                    : c.receiver?.name || "Unknown";

                  return (
                    <tr key={c._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={avatarSrc}
                            alt=""
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              background: "var(--panel-2)",
                              flexShrink: 0,
                            }}
                          />
                          <span className="fw-semibold" style={{ fontSize: "13px" }}>
                            {participantName}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="badge bg-dark" style={{ fontSize: "9px" }}>
                          {isGroup ? "Group" : "Private"}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "12.5px" }}>
                          {c.callType === "video" ? (
                            <FaVideo size={11} />
                          ) : (
                            <FaPhoneAlt size={11} />
                          )}
                          {c.callType === "video" ? "Video" : "Audio"}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted" style={{ fontSize: "12.5px" }}>
                          {c.caller?.name || "Someone"}
                        </span>
                      </td>

                      <td>
                        {c.status ? (
                          <span className={`badge ${statusBadgeClass(c.status)}`} style={{ fontSize: "9px" }}>
                            {c.status}
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "12px" }}>
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="text-muted" style={{ fontSize: "12.5px" }}>
                          {formatDuration(c.duration)}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted" style={{ fontSize: "12px" }}>
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Delete call record"
                          onClick={() => handleDelete(c._id)}
                          disabled={deletingId === c._id}
                        >
                          <FaTrash size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
};

export default AllCallRecords;
