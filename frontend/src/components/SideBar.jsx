import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ⚠️ .env file me REACT_APP_API_URL set hona chahiye (e.g. https://your-backend.onrender.com)
// Change karne ke baad dev server restart / redeploy zaroori hai
const API_BASE_URL = process.env.REACT_APP_API_URL;

const GROUP_SEARCH_API = `${API_BASE_URL}/api/user/get-my-group`;
const USER_SEARCH_API = `${API_BASE_URL}/api/users/all-users`;

const PAGE_LIMIT = 5;

const SideBar = ({
  activeTab,
  setActiveTab,
  sortedGroup,
  sortedUsers,
  setSelectedGroup,
  setSelectedUser,
  openPrivateChat,
  onSelectGroup,
  unreadCounts = { groups: {}, users: {} },
  setShowGroupInfo,
  setShowMedia,
  setPreviewImage,
  setShowMenu,
  showMenu,
  handleLogout,
  menuRef,
  isOnline,
  user,
  groupTypingUsers = {},
  privateTypingStatus = {},
}) => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // ---- server-side search state (separate from real-time props) ----
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const requestIdRef = useRef(0); // race-condition guard for fast typing

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
    setDebouncedTerm("");
    setSearchResults([]);
    setSearchHasMore(false);
    setSearchPage(1);
  }, [activeTab]);

  const fetchSearchResults = useCallback(
    async (term, page, append = false) => {
      const currentRequestId = ++requestIdRef.current;
      const url = activeTab === "groups" ? GROUP_SEARCH_API : USER_SEARCH_API;
      const token = localStorage.getItem("token");

      if (append) setLoadMoreLoading(true);
      else setSearchLoading(true);

      try {
        const { data } = await axios.get(url, {
          params: { search: term, page, limit: PAGE_LIMIT },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // stale response ignore karo agar naya request already start ho chuka hai
        if (currentRequestId !== requestIdRef.current) return;

        const items = activeTab === "groups" ? data.groups : data.users;

        setSearchResults((prev) => (append ? [...prev, ...items] : items));
        setSearchHasMore(Boolean(data.pagination?.hasMore));
        setSearchPage(page);
      } catch (err) {
        console.error("Search API failed:", err);
        if (!append) setSearchResults([]);
        setSearchHasMore(false);
      } finally {
        setSearchLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    if (!debouncedTerm) {
      setSearchResults([]);
      setSearchHasMore(false);
      setSearchPage(1);
      return;
    }
    fetchSearchResults(debouncedTerm, 1, false);
  }, [debouncedTerm, fetchSearchResults]);

  const handleLoadMore = () => {
    if (loadMoreLoading || !searchHasMore) return;
    fetchSearchResults(debouncedTerm, searchPage + 1, true);
  };

  // ---- decide what to render: server search results vs live props ----
  const isSearchMode = Boolean(debouncedTerm);

  const displayedGroups = isSearchMode ? searchResults : sortedGroup;
  const displayedUsers = isSearchMode ? searchResults : sortedUsers;

  const totalGroupUnread = useMemo(
    () =>
      Object.values(unreadCounts?.groups || {}).reduce(
        (sum, c) => sum + (c || 0),
        0
      ),
    [unreadCounts]
  );

  const totalUserUnread = useMemo(
    () =>
      Object.values(unreadCounts?.users || {}).reduce(
        (sum, c) => sum + (c || 0),
        0
      ),
    [unreadCounts]
  );

  return (
    <div className="cv-sidebar">
      <div className="cv-sidebar-top">
        <div className="cv-menu-wrapper" ref={menuRef}>
          {showMenu && (
            <div className="cv-profile-menu">
              <div
                className="cv-profile-item"
                onClick={() => {
                  setShowMenu(false);
                }}
              >
                <i className="fa-solid fa-user"></i>
                Profile
              </div>

              <div className="cv-profile-item danger" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {user && (
        <div
          className="cv-me-card"
          onClick={() => {
            navigate("/profile");
          }}
          title="View profile"
        >
          <img src={user.image} alt="" className="cv-me-avatar" />
          <div className="cv-me-info">
            <div className="cv-me-name">{user.name}</div>
            <div className="cv-me-sub">{user.email}</div>
          </div>
          <i className="fa-solid fa-chevron-right cv-row-chevron"></i>
        </div>
      )}

      <p className="cv-brand-tag cv-sidebar-subtitle">Your private spaces</p>

      <div className="cv-dial">
        <button
          type="button"
          className={activeTab === "groups" ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("groups");
          }}
        >
          Groups
          {totalGroupUnread > 0 && (
            <span className="cv-dial-badge">
              {totalGroupUnread > 99 ? "99+" : totalGroupUnread}
            </span>
          )}
        </button>

        <button
          type="button"
          className={activeTab === "chats" ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("chats");
          }}
        >
          Chats
          {totalUserUnread > 0 && (
            <span className="cv-dial-badge">
              {totalUserUnread > 99 ? "99+" : totalUserUnread}
            </span>
          )}
        </button>
      </div>

      {activeTab === "groups" && (
        <div className="cv-fab-row">
          <button
            type="button"
            className="cv-fab cv-fab-half"
            data-bs-toggle="modal"
            data-bs-target="#createGroupModal"
          >
            <i className="fa-solid fa-plus"></i>
            New group
          </button>

          <button
            type="button"
            className="cv-fab cv-fab-half cv-fab-ghost"
            data-bs-toggle="modal"
            data-bs-target="#joinGroupModal"
          >
            <i className="fa-solid fa-right-to-bracket"></i>
            Join group
          </button>
        </div>
      )}

      <div className="cv-search-wrapper">
        <i className="fa-solid fa-magnifying-glass cv-search-icon"></i>
        <input
          type="text"
          className="cv-search-input"
          placeholder={
            activeTab === "groups" ? "Search groups..." : "Search chats..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <i
            className="fa-solid fa-xmark cv-search-clear"
            onClick={() => setSearchTerm("")}
          ></i>
        )}
      </div>

      <div className="cv-list">
        {searchLoading ? (
          <div className="cv-empty-list">Searching...</div>
        ) : activeTab === "groups" ? (
          displayedGroups.length > 0 ? (
            <>
              {displayedGroups.map((group) => {
                const isGroupTyping =
                  groupTypingUsers[group._id] &&
                  Object.keys(groupTypingUsers[group._id]).length > 0;

                const unreadCount = unreadCounts?.groups?.[group._id] || 0;

                return (
                  <div
                    key={group._id}
                    className="cv-row"
                    onClick={() => {
                      if (onSelectGroup) {
                        onSelectGroup(group);
                      } else {
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
                      <div
                        className={`cv-row-sub ${
                          isGroupTyping ? "cv-typing-text" : ""
                        }`}
                      >
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
              })}

              {isSearchMode && searchHasMore && (
                <button
                  type="button"
                  className="cv-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadMoreLoading}
                >
                  {loadMoreLoading ? "Loading..." : "Load more"}
                </button>
              )}
            </>
          ) : (
            <div className="cv-empty-list">
              {debouncedTerm ? "No groups found" : "No groups yet"}
            </div>
          )
        ) : displayedUsers.length > 0 ? (
          <>
            {displayedUsers.map((u) => {
              const isUserTyping = Boolean(privateTypingStatus[u._id]);
              const unreadCount = unreadCounts?.users?.[u._id] || 0;

              return (
                <div
                  key={u._id}
                  className="cv-row"
                  onClick={() => openPrivateChat(u)}
                >
                  <div className="cv-avatar-wrap">
                    <img src={u.image} className="cv-row-avatar" alt="" />
                    {isOnline && isOnline(u._id) && (
                      <span className="cv-online-dot"></span>
                    )}
                  </div>

                  <div className="flex-grow-1">
                    <div className="cv-row-name">{u.name}</div>
                    <div
                      className={`cv-row-sub ${
                        isUserTyping ? "cv-typing-text" : ""
                      }`}
                    >
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
            })}

            {isSearchMode && searchHasMore && (
              <button
                type="button"
                className="cv-load-more-btn"
                onClick={handleLoadMore}
                disabled={loadMoreLoading}
              >
                {loadMoreLoading ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        ) : (
          <div className="cv-empty-list">
            {debouncedTerm ? "No users found" : "No users found"}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;