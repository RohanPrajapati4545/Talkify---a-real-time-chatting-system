import { useNavigate } from "react-router-dom";

const SideBar = ({
  activeTab,
  setActiveTab,
    sortedGroup,  
  sortedUsers,
  setSelectedGroup,
  setSelectedUser,
  openPrivateChat,
  onSelectGroup, // 👈 NAYA — group open karne ka helper (unread reset karta hai)
  unreadCounts = { groups: {}, users: {} }, // 👈 NAYA
  setShowGroupInfo,
  setShowMedia,
  setPreviewImage,
  setShowMenu,
  showMenu,
  handleLogout,
  menuRef,
  isOnline,
  user, //
  groupTypingUsers = {}, // 
  privateTypingStatus = {}, //
}) => {
  const navigate = useNavigate();

  return (
    <div className="cv-sidebar">

      {/* HEADER */}
      <div className="cv-sidebar-top">

        <div className="cv-brand">
          <span className="cv-brand-mark">Talkify</span>
        </div>

        <div className="cv-menu-wrapper" ref={menuRef}>

          <div
            className="cv-avatar-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </div>

          {showMenu && (
            <div className="cv-profile-menu">

              <div
                className="cv-profile-item"
                onClick={() => {
                  navigate("/profile");
                  setShowMenu(false);
                }}
              >
                <i className="fa-solid fa-user"></i>
                Profile
              </div>

              <div
                className="cv-profile-item danger"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
              </div>

            </div>
          )}

        </div>

      </div>

      {/* LOGGED-IN USER INFO CARD */}
      {user && (
        <div
          className="cv-me-card"
          onClick={() => navigate("/profile")}
          title="View profile"
        >
          <img
            src={user.image}
            alt=""
            className="cv-me-avatar"
          />
          <div className="cv-me-info">
            <div className="cv-me-name">{user.name}</div>
            <div className="cv-me-sub">{user.email}</div>
          </div>
          <i className="fa-solid fa-chevron-right cv-row-chevron"></i>
        </div>
      )}

      <p className="cv-brand-tag cv-sidebar-subtitle">Your private spaces</p>

      {/* TABS */}
      <div className="cv-dial">
        <button
          className={activeTab === "groups" ? "active" : ""}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </button>

        <button
          className={activeTab === "chats" ? "active" : ""}
          onClick={() => setActiveTab("chats")}
        >
          Chats
        </button>
      </div>

      {/* NEW GROUP BUTTON */}
      {activeTab === "groups" && (
        <div className="cv-fab-row">
          <button
            className="cv-fab cv-fab-half"
            data-bs-toggle="modal"
            data-bs-target="#createGroupModal"
          >
            <i className="fa-solid fa-plus"></i>
            New group
          </button>

          <button
            className="cv-fab cv-fab-half cv-fab-ghost"
            data-bs-toggle="modal"
            data-bs-target="#joinGroupModal"
          >
            <i className="fa-solid fa-right-to-bracket"></i>
            Join group
          </button>
        </div>
      )}

      {/* LIST */}
      <div className="cv-list">

        {activeTab === "groups" ? (
          sortedGroup.length > 0 ? (
            sortedGroup.map((group) => {

              // is group me koi typing kar raha hai?
              const isGroupTyping =
                groupTypingUsers[group._id] &&
                Object.keys(groupTypingUsers[group._id]).length > 0;

              // 👇 NAYA — is group ka unread count
              const unreadCount = unreadCounts?.groups?.[group._id] || 0;

              return (
                <div
                  key={group._id}
                  className="cv-row"
                  onClick={() => {
                    if (onSelectGroup) {
                      onSelectGroup(group);
                    } else {
                      // fallback agar onSelectGroup pass nahi hua ho
                      setShowGroupInfo(false);
                      setShowMedia(false);
                      setPreviewImage(null);
                      setSelectedGroup(group);
                      setSelectedUser(null);
                    }
                  }}
                >
                  <img
                    src={group.groupImage}
                    className="cv-row-avatar"
                    alt=""
                  />

                  <div className="flex-grow-1">
                    <div className="cv-row-name">{group.groupName}</div>
                    <div className={`cv-row-sub ${isGroupTyping ? "cv-typing-text" : ""}`}>
                      {isGroupTyping
                        ? "typing…"
                        : `${group.members.length} members`}
                    </div>
                  </div>

                  {unreadCount > 0 ? (
                    <span className="cv-unread-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : (
                    <i className="fa-solid fa-chevron-right cv-row-chevron"></i>
                  )}
                </div>
              );
            })
          ) : (
            <div className="cv-empty-list">No groups yet</div>
          )
        ) : sortedUsers.length > 0 ? (
          sortedUsers.map((u) => {

            //  ye user abhi type kar raha hai?
            const isUserTyping = Boolean(privateTypingStatus[u._id]);

            // 👇 NAYA — is user se aaye unread messages ka count
            const unreadCount = unreadCounts?.users?.[u._id] || 0;

            return (
              <div
                key={u._id}
                className="cv-row"
                onClick={() => openPrivateChat(u)}
              >
                <div className="cv-avatar-wrap">
                  <img
                    src={u.image}
                    className="cv-row-avatar"
                    alt=""
                  />
                  {isOnline && isOnline(u._id) && (
                    <span className="cv-online-dot"></span>
                  )}
                </div>

                <div className="flex-grow-1">
                  <div className="cv-row-name">{u.name}</div>
                  <div className={`cv-row-sub ${isUserTyping ? "cv-typing-text" : ""}`}>
                    {isUserTyping ? "typing…" : u.email}
                  </div>
                </div>

                {unreadCount > 0 ? (
                  <span className="cv-unread-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : (
                  <i className="fa-solid fa-chevron-right cv-row-chevron"></i>
                )}
              </div>
            );
          })
        ) : (
          <div className="cv-empty-list">No users found</div>
        )}

      </div>
    </div>
  );
};

export default SideBar;