import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
const Home = () => {
  const [roomId, setRoomId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState("");
  const navigate = useNavigate()
  const joinRoom = () => {
    if (!roomId.trim()) return;
    console.log("Joined Room:", roomId);
  };
  const createGroup = async () => {
    try {
      const formData = new FormData();

      formData.append("groupName", groupName);
    
      formData.append("members", JSON.stringify(members));
      if (!groupName || !groupImage) {
        return toast.error("All fields are required")
      }
      if (groupImage) {
        formData.append("groupImage", groupImage);
      }

      const res = await axios.post(
        "http://localhost:5000/api/user/create-group",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate("/my-groups")
      Swal.fire({
        icon: "success",
        title: res.data.message,
      });

      setGroupName("");
      setGroupImage(null);
      setMembers([]);
setMemberEmail("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title:
          error.response?.data?.message ||
          "Something went wrong",
      });
    }
  };



  return (<>

    <div className="container ">

      <div className="col-md-8 bg-white p-4 mx-auto bgDark">
        <h2 className="text-center fw-bold text-light mb-5" >
          Welcome to ChatVerse
        </h2>
        <div className="row g-4">

          <div className="col-md-6">
            <div className="create-group-card">

              <div className="icon-box">
                <i className="fa-solid fa-users"></i>
              </div>

              <h4 className="fw-bold">Create Group</h4>

              <p>
                Create your own private room and invite friends.
              </p>

              <button className="btn create-btn mt-3 " data-bs-toggle="modal"
                data-bs-target="#createGroupModal">
                Create Now
              </button>

            </div>
          </div>

          <div className="col-md-6">
            <div className="join-group-card">

              <div className="join-icon-box">
                <i className="fa-solid fa-door-open"></i>
              </div>

              <h4 className="fw-bold">Join Group</h4>

              <p>
                Enter room code and join conversations instantly.
              </p>

              <input
                type="text"
                className="form-control mb-3"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />

              <button
                className=" btn join-btn"
                onClick={joinRoom}
              >
                Join Now
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>






    {/* model for creating group */}

    <div
      className="modal fade"
      id="createGroupModal"
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content create-modal">

          <div className="modal-header create-modal-header">
            <h5 className="modal-title fw-bold">
              <i className="fa-solid fa-users me-2"></i>
              Create New Group
            </h5>

            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>

          <div className="modal-body">

            <div className="text-center mb-4">

              {groupImage ? (
                <img
                  src={URL.createObjectURL(groupImage)}
                  alt="Group Preview"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ddd",
                  }}
                />
              ) : (
                <div className="group-upload-icon">
                  <i className="fa-solid fa-camera"></i>
                </div>
              )}

              <input
                type="file"
                className="form-control mt-3"
                accept="image/*"
                onChange={(e) => setGroupImage(e.target.files[0])}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Group Name
              </label>

              <input
                type="text"
                className="form-control custom-input"
                placeholder="Enter Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

<div className="mb-3">
  <label className="form-label fw-semibold">
    Add Members
  </label>

  <div className="d-flex gap-2">
    <input
      type="email"
      className="form-control"
      placeholder="Enter member email"
      value={memberEmail}
      onChange={(e) => setMemberEmail(e.target.value)}
    />

    <button
      type="button"
      className="btn join-btn"
      onClick={() => {
        if (!memberEmail.trim()) return;

        setMembers([...members, memberEmail]);
        setMemberEmail("");
      }}
    >
      Add
    </button>
  </div>
</div>


<div className="mb-3">
  {members.map((member, index) => (
    <div
      key={index}
      className="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
    >
      <span>{member}</span>

      <i
        className="fa-solid fa-xmark text-danger"
        style={{ cursor: "pointer" }}
        onClick={() =>
          setMembers(
            members.filter((_, i) => i !== index)
          )
        }
      ></i>
    </div>
  ))}
</div>


          </div>



          <div className="modal-footer border-0">

            <button
              className="btn cancel-btn"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>

            <button
              className="btn join-btn" data-bs-dismiss="modal"
              onClick={createGroup}
            >
              Create Group
            </button>

          </div>

        </div>
      </div>
    </div>



    <button className="my-groups-btn mx-auto login-btn" onClick={() => navigate("/my-groups")}>
      <span>MY GROUPS</span>
      <div className="my-groups-icon">
        <i className="fa-solid fa-angle-right"></i>
        <i className="fa-solid fa-angle-right"></i>
      </div>
    </button>
  </>
  );
};

export default Home;