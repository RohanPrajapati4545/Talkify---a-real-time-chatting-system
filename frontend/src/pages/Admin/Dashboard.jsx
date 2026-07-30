import React, { useEffect, useState } from "react";
import { FaUsers, FaUserFriends, FaComments, FaCircle } from "react-icons/fa";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

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

      setGroups(res.data.groups);
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

  useEffect(() => {
    getUsers();
    getGroups();
    getMessagesCount();
  }, []);

  const onlineCount = users.filter((u) => u.isOnline).length;

  return (
    <div className="dashboard-wrapper p-4">
    
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Dashboard</h2>
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
        <div className="col-lg-4 col-md-6">
          <div className="stats-card p-4 bg-white rounded-4 shadow-sm h-100">
            <FaUsers size={30} className="mb-3" style={{ color: "var(--amber)" }} />
            <h6 className="text-muted">Total Users</h6>
            <h3 className="fw-bold">{totalUsers}</h3>
            <small>{onlineCount} online right now</small>
          </div>
        </div>

        <div className="col-lg-4 col-md-6">
          <div className="stats-card p-4 bg-white rounded-4 shadow-sm h-100">
            <FaUserFriends size={30} className="mb-3" style={{ color: "var(--amber)" }} />
            <h6 className="text-muted">Total Groups</h6>
            <h3 className="fw-bold">{totalGroups}</h3>
            <small>Active Groups</small>
          </div>
        </div>

        <div className="col-lg-4 col-md-6">
          <div className="stats-card p-4 bg-white rounded-4 shadow-sm h-100">
            <FaComments size={30} className="mb-3" style={{ color: "var(--amber)" }} />
            <h6 className="text-muted">Total Messages</h6>
            <h3 className="fw-bold">{totalMessages}</h3>
            <small>Messages Sent</small>
          </div>
        </div>
      </div>
 
      <div className="row g-4 mt-3">
        {/* Recent conversations / groups, chat-app style */}
        <div className="col-lg-7">
          <div className="bg-white rounded-4 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0">Active Groups</h4>
              <span className="badge bg-dark px-3 py-2">{totalGroups} Groups</span>
            </div>

            <div className="d-flex flex-column gap-3">
              {groups.slice(0, 6).map((g) => (
                <div
                  key={g._id}
                  className="d-flex align-items-center justify-content-between p-2 rounded-3"
                  
                >
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={g.groupImage}
                      alt=""
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <div className="fw-semibold">{g.groupName}</div>
                      <small className="text-muted">
                        {g.members?.length || 0} members
                      </small>
                    </div>
                  </div>

                  <FaComments style={{ color: "var(--amber)" }} />
                </div>
              ))}

              {groups.length === 0 && (
                <div className="text-center py-4 text-muted">No Groups Found</div>
              )}
            </div>
          </div>
        </div>

   
        <div className="col-lg-5">
          <div className="bg-white rounded-4 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0">Recent Users</h4>
              <span className="badge bg-dark">{totalUsers} Users</span>
            </div>

            <div className="d-flex flex-column gap-3">
              {users.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="d-flex align-items-center justify-content-between p-2 rounded-3"
                 
                >
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ position: "relative" }}>
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
                      <FaCircle
                        size={10}
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          color: item.isOnline ? "#2ecc71" : "#b0b0b0",
                          background: "#fff",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                    <span className="fw-semibold">{item.name}</span>
                  </div>

                  {item.isOnline ? (
                    <span className="badge bg-success">Online</span>
                  ) : (
                    <span className="badge bg-secondary">Offline</span>
                  )}
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-4 text-muted">No Users Found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;