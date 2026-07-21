import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AllCallRecords = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [callType, setCallType] = useState(""); // "" | "video" | "audio"
  const [scope, setScope] = useState("");       // "" | "group" | "private"

  const fetchCalls = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/call-records`, {
        params: { page: pageNum, limit: 20, search, callType, scope },
        headers: { Authorization: `Bearer ${token}` },
      });
      setCalls(data.calls || []);
      setHasMore(Boolean(data.pagination?.hasMore));
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch call records:", err);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [search, callType, scope]);

  useEffect(() => {
    fetchCalls(1);
  }, [fetchCalls]);

  return (
    <div className="p-4">
      <h3 className="fw-bold mb-3">Call Records</h3>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: 250 }}
          placeholder="Search by user or group name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="form-select" style={{ maxWidth: 160 }} value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="">All chats</option>
          <option value="group">Group calls</option>
          <option value="private">Private calls</option>
        </select>

        <select className="form-select" style={{ maxWidth: 160 }} value={callType} onChange={(e) => setCallType(e.target.value)}>
          <option value="">All types</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Type</th>
              <th>Caller</th>
              <th>Receiver / Group</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center">Loading...</td></tr>
            ) : calls.length === 0 ? (
              <tr><td colSpan={5} className="text-center">No call records found</td></tr>
            ) : (
              calls.map((c) => (
                <tr key={c._id}>
                  <td>
                    <i className={`fa-solid ${c.callType === "video" ? "fa-video" : "fa-phone"} me-1`}></i>
                    {c.callType} {c.group ? "(Group)" : "(Private)"}
                  </td>
                  <td>{c.caller?.name || "—"}</td>
                  <td>{c.group ? c.group.groupName : c.receiver?.name || "—"}</td>
                  <td>{c.status || "—"}</td>
                  <td>{new Date(c.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button className="btn btn-outline-primary" onClick={() => fetchCalls(page + 1)} disabled={loading}>
          Load more
        </button>
      )}
    </div>
  );
};

export default AllCallRecords;