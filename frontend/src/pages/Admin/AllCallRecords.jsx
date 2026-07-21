import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaPhoneAlt, FaVideo, FaUsers, FaUser } from "react-icons/fa";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AllCallRecords = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [callType, setCallType] = useState(""); // "" | "video" | "audio"
  const [scope, setScope] = useState("");       // "" | "group" | "private"

  const fetchCalls = useCallback(
    async (pageNum = 1, append = false) => {
      if (append) setLoadMoreLoading(true);
      else setLoading(true);

      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_BASE_URL}/api/admin/call-records`, {
          params: { page: pageNum, limit: 20, search, callType, scope },
          headers: { Authorization: `Bearer ${token}` },
        });

        setCalls((prev) => (append ? [...prev, ...(data.calls || [])] : data.calls || []));
        setHasMore(Boolean(data.pagination?.hasMore));
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to fetch call records:", err);
        if (!append) setCalls([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [search, callType, scope]
  );

  useEffect(() => {
    fetchCalls(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, callType, scope]);

  const handleLoadMore = () => {
    if (loadMoreLoading || !hasMore) return;
    fetchCalls(page + 1, true);
  };

  const statusBadgeClass = (status) => {
    if (status === "missed" || status === "rejected") return "bg-danger";
    if (status === "completed" || status === "answered") return "bg-success";
    return "bg-secondary";
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

        {!loading &&
          calls.map((c) => {
            const isGroup = Boolean(c.group);

            return (
              <div className="member-row" key={c._id}>
                <div className="d-flex align-items-center gap-2">
                  <img
                    src={isGroup ? c.group?.groupImage : c.receiver?.image}
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
                    <div className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                      {isGroup ? c.group?.groupName : c.receiver?.name || "Unknown"}
                      <span className="badge bg-dark" style={{ fontSize: "9px" }}>
                        {isGroup ? "Group" : "Private"}
                      </span>
                      {c.status && (
                        <span className={`badge ${statusBadgeClass(c.status)}`} style={{ fontSize: "9px" }}>
                          {c.status}
                        </span>
                      )}
                    </div>

                    <div className="text-muted" style={{ fontSize: "11.5px" }}>
                      {c.callType === "video" ? (
                        <FaVideo size={10} className="me-1" />
                      ) : (
                        <FaPhoneAlt size={10} className="me-1" />
                      )}
                      Started by {c.caller?.name || "Someone"} · {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {!loading && hasMore && (
          <button
            type="button"
            className="btn btn-sm btn-outline-dark w-100 mt-2"
            onClick={handleLoadMore}
            disabled={loadMoreLoading}
          >
            {loadMoreLoading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AllCallRecords;