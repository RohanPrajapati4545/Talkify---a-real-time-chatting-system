import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";

const AllUsers = () => {
  const { token } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const getUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.users);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

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
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/${action}-user`,
          { userId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Swal.fire({
          title: "Done",
          text: `User ${action}ed successfully.`,
          icon: "success",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });

        getUsers();
      } catch (error) {
        console.log(error);
        Swal.fire({
          title: "Error",
          text: "Something went wrong.",
          icon: "error",
          background: "#1c1812",
          color: "#f2ece2",
          confirmButtonColor: "#e8a33d",
        });
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

        getUsers();
      } catch (error) {
        console.log(error);
      }
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <span className="badge bg-dark px-3 py-2">{filteredUsers.length} Users</span>
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
              {filteredUsers.map((item) => (
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

                  <td>{item.email}</td>

                  <td>
                    {item.isOnline ? (
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
                    <div className="d-flex gap-2">
                      <button
                        className={`btn btn-sm ${
                          item.isBlocked ? "btn-outline-warning" : "btn-outline-danger"
                        }`}
                        onClick={() => handleBlockToggle(item)}
                      >
                        {item.isBlocked ? "Unblock" : "Block"}
                      </button>

                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-4">No Users Found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllUsers;