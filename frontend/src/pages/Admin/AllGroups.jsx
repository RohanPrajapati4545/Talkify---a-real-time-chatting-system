import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";

const AllGroups = () => {
  const { token } = useSelector((state) => state.auth);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const getGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-group`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(res.data.groups);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getGroups();
  }, []);

  const handleDelete = (group) => {
    Swal.fire({
      title: "Delete Group?",
      text: `This will permanently delete "${group.name}".`,
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

        getGroups();
      } catch (error) {
        console.log(error);
      }
    });
  };

  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">All Groups</h2>
          <p className="text-muted mb-0">Manage active groups</p>
        </div>

        <input
          type="text"
          className="form-control admin-search"
          placeholder="Search by group name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "280px" }}
        />
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold m-0">Groups</h4>
          <span className="badge bg-dark px-3 py-2">{filteredGroups.length} Groups</span>
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
              {filteredGroups.map((item) => (
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

                  <td>{item.createdBy?.name || "—"}</td>

                  <td>{item.members?.length ?? 0}</td>

                  <td>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredGroups.length === 0 && (
            <div className="text-center py-4">No Groups Found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllGroups;