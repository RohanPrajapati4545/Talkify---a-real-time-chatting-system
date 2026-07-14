import React, { useEffect, useState } from "react";
import { FaUsers, FaUserFriends, FaComments, FaFlag } from "react-icons/fa";
import { useSelector } from "react-redux";
import axios from "axios";
import mediaUrl from "../../globalimg/Globalimg";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Dashboard = () => {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalReports, setTotalReports] = useState(0);

  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);

  const getUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(res.data.users);
      setTotalUsers(res.data.users.length);
    } catch (error) {
      console.log(error);
    }
  };

  const getGroups = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-group`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTotalGroups(res.data.groups.length);
    } catch (error) {
      console.log(error);
    }
  };

  const getMessagesCount = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-messages-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTotalMessages(res.data.count);
    } catch (error) {
      console.log(error);
    }
  };

  const getReports = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-reported-messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReports(res.data.reports);
      setTotalReports(res.data.reports.length);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAction = (report, action) => {
    const actionText =
      action === "block"
        ? "block this user"
        : action === "delete"
        ? "delete this message"
        : "warn this user";

    Swal.fire({
      title: "Are you sure?",
      text: `You want to ${actionText}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Continue",
      background: "#1c1812",
      color: "#f2ece2",
      confirmButtonColor: "#e8a33d",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/admin/${action}-report`,
            { reportId: report._id },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          Swal.fire({
            title: "Done",
            text: "Action completed successfully.",
            icon: "success",
            background: "#1c1812",
            color: "#f2ece2",
            confirmButtonColor: "#e8a33d",
          });
          getReports();
        } catch (error) {
          console.log(error);
        }
      }
    });
  };

  useEffect(() => {
    getUsers();
    getGroups();
    getMessagesCount();
    getReports();
  }, []);

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 clickable">Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {user?.name}</p>
        </div>

        <img
          className="clickable"
          onClick={() => navigate("/admin/profile")}
          src={`${user?.image}`}
          alt=""
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid var(--hairline)",
          }}
        />
      </div>

      <div className="row g-4">
        <div className="col-lg-3 col-md-6">
          <div className="stats-card p-4 bg-white rounded-4 shadow-sm h-100">
            <FaUsers size={30} className="mb-3" style={{ color: "var(--amber)" }} />
            <h6 className="text-muted">Total Users</h6>
            <h3 className="fw-bold">{totalUsers}</h3>
            <small>Registered Users</small>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stats-card p-4 bg-white rounded-4 shadow-sm h-100">
            <FaUserFriends size={30} className="mb-3" style={{ color: "var(--amber)" }} />
            <h6 className="text-muted">Total Groups</h6>
            <h3 className="fw-bold">{totalGroups}</h3>
            <small>Active Groups</small>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stats-card p-4 bg-white rounded-4 shadow-sm h-100">
            <FaComments size={30} className="mb-3" style={{ color: "var(--amber)" }} />
            <h6 className="text-muted">Total Messages</h6>
            <h3 className="fw-bold">{totalMessages}</h3>
            <small>Messages Sent</small>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stats-card p-4 bg-white rounded-4 shadow-sm h-100">
            <FaFlag size={30} className="mb-3" style={{ color: "var(--danger)" }} />
            <h6 className="text-muted">Reported Content</h6>
            <h3 className="fw-bold">{totalReports}</h3>
            <small>Pending Review</small>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-3">
        <div className="col-lg-7">
          <div className="bg-white rounded-4 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold">Reported Messages</h4>

              <span className="badge bg-dark px-3 py-2">
                {totalReports} Reports
              </span>
            </div>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Message</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.slice(0, 5).map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={`${mediaUrl}${item?.sender?.image}`}
                            alt=""
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <span className="fw-semibold">
                            {item?.sender?.name}
                          </span>
                        </div>
                      </td>

                      <td className="text-truncate" style={{ maxWidth: "180px" }}>
                        {item.messageText}
                      </td>

                      <td>{item.reason}</td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleAction(item, "warn")}
                          >
                            Warn
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleAction(item, "block")}
                          >
                            Block
                          </button>

                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => handleAction(item, "delete")}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {reports.length === 0 && (
                <div className="text-center py-4">No Reports Found</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="bg-white rounded-4 shadow-sm p-4" style={{ height: "100%" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0">Recent Users</h4>

              <span className="badge bg-dark">{totalUsers} Users</span>
            </div>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {users.slice(0, 5).map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
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
                          <span className="fw-semibold">{item.name}</span>
                        </div>
                      </td>

                      <td>
                        {item.isOnline ? (
                          <span className="badge bg-success">Online</span>
                        ) : (
                          <span className="badge bg-secondary">Offline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-4">No Users Found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;