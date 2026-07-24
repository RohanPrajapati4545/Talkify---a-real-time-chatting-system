import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";

const CONTACT_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 500;

// Builds a compact list of page numbers with "..." for large page counts.
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

const statusBadgeClass = {
  new: "bg-warning text-dark",
  read: "bg-secondary",
  resolved: "bg-success",
};

const ContactUs = () => {
  const { token } = useSelector((state) => state.auth);

  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [viewContact, setViewContact] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const requestIdRef = useRef(0);
  const isFirstSearchRef = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / CONTACT_LIMIT));

  const fetchContacts = async (term, status, pageNum) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/contact/all`,
        {
          params: {
            search: term || undefined,
            status: status || undefined,
            page: pageNum,
            limit: CONTACT_LIMIT,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (currentRequestId !== requestIdRef.current) return;

      const list = res.data.contacts || [];
      setContacts(list);
      setTotal(res.data.pagination?.total ?? list.length);
      setPage(pageNum);
    } catch (error) {
      console.log(error);
      setContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts("", "", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    fetchContacts(debouncedSearch, statusFilter, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (newPage === page || loading) return;
    fetchContacts(debouncedSearch, statusFilter, newPage);
  };

  const showErrorAlert = (error, fallbackText) => {
    const backendMsg = error?.response?.data?.message || error?.response?.data?.msg;
    Swal.fire({
      title: "Error",
      text: backendMsg || fallbackText,
      icon: "error",
      background: "#1c1812",
      color: "#f2ece2",
      confirmButtonColor: "#e8a33d",
    });
  };

  const handleStatusChange = async (contact, newStatus) => {
    try {
      setActionLoadingId(contact._id);

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/contact/${contact._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setContacts((prev) =>
        prev.map((c) =>
          c._id === contact._id ? { ...c, status: res.data.contact?.status ?? newStatus } : c
        )
      );

      if (viewContact?._id === contact._id) {
        setViewContact((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.log(error);
      showErrorAlert(error, "Could not update status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (contact) => {
    Swal.fire({
      title: "Delete Message?",
      text: `This will permanently delete the message from ${contact.name}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc3545",
      background: "#1c1812",
      color: "#f2ece2",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setActionLoadingId(contact._id);

        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/contact/${contact._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
          title: "Deleted",
          text: "Message has been removed.",
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });

        setViewContact(null);

        const isLastItemOnPage = contacts.length === 1 && page > 1;
        fetchContacts(debouncedSearch, statusFilter, isLastItemOnPage ? page - 1 : page);
      } catch (error) {
        console.log(error);
        showErrorAlert(error, "Could not delete message.");
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const openViewModal = (contact) => {
    setViewContact(contact);
    // opening a "new" message marks it read, same as most inboxes
    if (contact.status === "new") {
      handleStatusChange(contact, "read");
    }
  };

  const closeViewModal = () => setViewContact(null);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Contact Queries</h2>
          <p className="text-muted mb-0">Messages submitted through the Contact Us page</p>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h5 className="fw-bold m-0">Queries</h5>
            <span className="badge bg-dark px-3 py-2">{total} Messages</span>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <select
              className="form-select admin-search"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: "150px" }}
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
            </select>

            <input
              type="text"
              className="form-control admin-search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: "260px" }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>Status</th>
                <th>Received</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {contacts.map((item) => {
                const isRowBusy = actionLoadingId === item._id;

                return (
                  <tr key={item._id} className="clickable" onClick={() => openViewModal(item)}>
                    <td className="fw-semibold">{item.name}</td>
                    <td>{item.email}</td>
                    <td style={{ maxWidth: "260px" }}>
                      <span
                        style={{
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.message}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass[item.status] || "bg-secondary"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "12.5px" }} className="text-muted">
                      {formatDate(item.createdAt)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex gap-2 flex-wrap">
                        {item.status !== "resolved" && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleStatusChange(item, "resolved")}
                            disabled={isRowBusy}
                          >
                            {isRowBusy ? "..." : "Resolve"}
                          </button>
                        )}
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

          {!loading && contacts.length === 0 && (
            <div className="text-center py-4">No Messages Found</div>
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

      {viewContact && (
        <>
          <div
            className="modal fade show d-block admin-edit-modal"
            tabIndex="-1"
            role="dialog"
            onClick={closeViewModal}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Message from {viewContact.name}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeViewModal}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label admin-label">Email</label>
                    <p className="mb-0">{viewContact.email}</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label admin-label">Received</label>
                    <p className="mb-0">{formatDate(viewContact.createdAt)}</p>
                  </div>

                  <div className="mb-1">
                    <label className="form-label admin-label">Message</label>
                    <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                      {viewContact.message}
                    </p>
                  </div>
                </div>

                <div className="modal-footer">
                  <select
                    className="form-select admin-input"
                    style={{ maxWidth: "160px" }}
                    value={viewContact.status}
                    onChange={(e) => handleStatusChange(viewContact, e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => window.open(`mailto:${viewContact.email}`, "_blank")}
                  >
                    Reply by Email
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(viewContact)}
                  >
                    Delete
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

export default ContactUs;