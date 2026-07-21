import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket/Socket"; // ⚠️ adjust this path if your project structure differs

const API_BASE_URL = process.env.REACT_APP_API_URL;

const GROUP_SEARCH_API = `${API_BASE_URL}/api/user/get-my-group`;
const USER_SEARCH_API = `${API_BASE_URL}/api/users/all-users`;

const PAGE_LIMIT = 10;

const SideBar = ({
  activeTab,
  setActiveTab,
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

  userLastActivity = {},
  groupLastActivity = {},
  groups = [],
  privateChatMap = {},
  allUsers = [],
  refreshSignal = 0,
}) => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const [listResults, setListResults] = useState([]);
  const [listPage, setListPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const requestIdRef = useRef(0);
  const activeTabRef = useRef(activeTab);
  const isFirstRefreshSignalRef = useRef(true);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ============== CALL HISTORY (Calls tab) ==============
  const [callHistory, setCallHistory] = useState([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(false);
  const callHistoryRequestIdRef = useRef(0);

  // existing endpoints reuse — har group aur har private chat ke call-logs
  // ko parallel me fetch karke ek merged, time-sorted list banate hain
  const fetchAllCallHistory = useCallback(async () => {
    const currentRequestId = ++callHistoryRequestIdRef.current;
    const token = localStorage.getItem("token");
    setCallHistoryLoading(true);

    try {
      const groupCallPromises = (groups || []).map((g) =>
        axios
          .get(`${API_BASE_URL}/api/user/call-logs/${g._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => (res.data.calls || []).map((c) => ({ ...c, _group: g })))
          .catch(() => [])
      );

      const privateChatEntries = Object.entries(privateChatMap || {}); // [otherUserId, chatId]
      const privateCallPromises = privateChatEntries.map(([otherId, chatId]) =>
        axios
          .get(`${API_BASE_URL}/api/private/call-logs/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) =>
            (res.data.calls || []).map((c) => ({ ...c, _otherUserId: otherId }))
          )
          .catch(() => [])
      );

      const results = await Promise.all([...groupCallPromises, ...privateCallPromises]);

      if (currentRequestId !== callHistoryRequestIdRef.current) return;

      const merged = results
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setCallHistory(merged);
    } finally {
      if (currentRequestId === callHistoryRequestIdRef.current) {
        setCallHistoryLoading(false);
      }
    }
  }, [groups, privateChatMap]);

  useEffect(() => {
    if (activeTab === "calls") {
      fetchAllCallHistory();
    }
  }, [activeTab, fetchAllCallHistory]);

  // real-time — koi naya call log aaye aur Calls tab khula ho to top pe daal do
  useEffect(() => {
    const handlePrivateCall = (call) => {
      if (activeTabRef.current !== "calls") return;
      const callerId = call.caller?._id || call.caller;
      const receiverId = call.receiver?._id || call.receiver;
      const otherId = callerId === user?._id ? receiverId : callerId;
      setCallHistory((prev) =>
        prev.some((c) => c._id === call._id)
          ? prev
          : [{ ...call, _otherUserId: otherId }, ...prev]
      );
    };

    const handleGroupCall = (call) => {
      if (activeTabRef.current !== "calls") return;
      const gId = call.group?._id || call.group;
      const group = groups.find((g) => g._id === gId);
      setCallHistory((prev) =>
        prev.some((c) => c._id === call._id)
          ? prev
          : [{ ...call, _group: group || call.group }, ...prev]
      );
    };

    socket.on("callLogAdded", handlePrivateCall);
    socket.on("groupCallLogAdded", handleGroupCall);

    return () => {
      socket.off("callLogAdded", handlePrivateCall);
      socket.off("groupCallLogAdded", handleGroupCall);
    };
  }, [groups, user?._id]);

  const fetchList = useCallback(
    async (term, page, append = false) => {
      const currentRequestId = ++requestIdRef.current;
      const url = activeTab === "groups" ? GROUP_SEARCH_API : USER_SEARCH_API;
      const token = localStorage.getItem("token");

      if (append) setLoadMoreLoading(true);
      else setLoading(true);

      try {
        const { data } = await axios.get(url, {
          params: { search: term, page, limit: PAGE_LIMIT },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });


        if (currentRequestId !== requestIdRef.current) return;

        const items = activeTab === "groups" ? data.groups : data.users;

        setListResults((prev) => (append ? [...prev, ...(items || [])] : (items || [])));
        setHasMore(Boolean(data.pagination?.hasMore));
        setListPage(page);
      } catch (err) {
        console.error("Fetch list failed:", err);
        if (!append) setListResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    // calls tab apna alag fetch (fetchAllCallHistory) use karta hai, isliye
    // yahan groups/chats wali list fetch skip kar do
    if (activeTab === "calls") return;

    setSearchTerm("");
    setDebouncedTerm("");
    setListResults([]);
    setHasMore(false);
    setListPage(1);
    fetchList("", 1, false);

  }, [activeTab]);





useEffect(() => {
  if (debouncedTerm === "") return;
  fetchList(debouncedTerm, 1, false);

}, [debouncedTerm]);

  // general-purpose fallback: parent bumps `refreshSignal` after any group
  // mutation that isn't already covered by a socket listener below (e.g.
  // creating a group, joining via invite code, editing name/photo)
  useEffect(() => {
    if (isFirstRefreshSignalRef.current) {
      isFirstRefreshSignalRef.current = false;
      return;
    }
    fetchList(debouncedTerm, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  // ============== REAL-TIME: keep the Groups list in sync ==============
  // Covers: a group being deleted, and a member (including the admin)
  // leaving — both cases the sidebar previously only picked up after a
  // full page refresh, since it fetches its own copy of the list.
  useEffect(() => {
    const handleGroupDeleted = ({ groupId }) => {
      if (activeTabRef.current !== "groups") return;
      setListResults((prev) => prev.filter((g) => g._id !== groupId));
    };

    const handleGroupMemberLeft = ({ groupId, userId, group }) => {
      if (activeTabRef.current !== "groups") return;

      // I'm the one who left — remove the group from my own list
      if (userId === user?._id) {
        setListResults((prev) => prev.filter((g) => g._id !== groupId));
        return;
      }

      // someone else left (possibly triggering an admin promotion) —
      // update that group's members/admin in place so member counts and
      // the "Admin" tag elsewhere stay accurate without a refetch
      if (group) {
        setListResults((prev) =>
          prev.map((g) => (g._id === groupId ? { ...g, ...group } : g))
        );
      }
    };

    socket.on("groupDeleted", handleGroupDeleted);
    socket.on("groupMemberLeft", handleGroupMemberLeft);

    return () => {
      socket.off("groupDeleted", handleGroupDeleted);
      socket.off("groupMemberLeft", handleGroupMemberLeft);
    };
  }, [user?._id]);

  // ============== REAL-TIME: pick up new groups instantly ==============
  // Covers: a brand new group being created (everyone added to it gets
  // notified), someone joining via invite code, and being added to an
  // existing group by its admin — all previously required a manual
  // refresh since this component fetches its own copy of the list.
  useEffect(() => {
    const handleGroupCreated = ({ group }) => {
      if (activeTabRef.current !== "groups" || !group) return;
      setListResults((prev) =>
        prev.some((g) => g._id === group._id) ? prev : [group, ...prev]
      );
    };

    const handleGroupMembersUpdated = ({ groupId, group }) => {
      if (activeTabRef.current !== "groups" || !group) return;
      setListResults((prev) => {
        const exists = prev.some((g) => g._id === groupId);
        if (exists) {
          return prev.map((g) => (g._id === groupId ? { ...g, ...group } : g));
        }
        // this group is new to me (I was just added/joined) — show it
        return [group, ...prev];
      });
    };

    socket.on("groupCreated", handleGroupCreated);
    socket.on("groupMembersUpdated", handleGroupMembersUpdated);

    return () => {
      socket.off("groupCreated", handleGroupCreated);
      socket.off("groupMembersUpdated", handleGroupMembersUpdated);
    };
  }, []);



  const handleLoadMore = () => {
    if (loadMoreLoading || !hasMore) return;
    fetchList(debouncedTerm, listPage + 1, true);
  };

  const isSearchMode = Boolean(debouncedTerm);

  // While searching, keep the backend's relevance/alphabetical order as-is.
  // Otherwise, reorder the currently-loaded page "most recent first" using
  // the activity timestamps passed down from the parent — same idea as a
  // typical chat app's conversation list.
  const displayedGroups = useMemo(() => {
    const base = activeTab === "groups" ? listResults : [];
    if (isSearchMode) return base;

    return [...base].sort((a, b) => {
      const ta =
        groupLastActivity[a._id] ??
        new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb =
        groupLastActivity[b._id] ??
        new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [activeTab, listResults, isSearchMode, groupLastActivity]);

  const displayedUsers = useMemo(() => {
    const base = activeTab === "chats" ? listResults : [];
    if (isSearchMode) return base;

    return [...base].sort((a, b) => {
      const ta = userLastActivity[a._id] ?? 0;
      const tb = userLastActivity[b._id] ?? 0;
      return tb - ta;
    });
  }, [activeTab, listResults, isSearchMode, userLastActivity]);

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

  const renderCallRow = (call) => {
    const icon = call.callType === "video" ? "fa-video" : "fa-phone";
    const timeLabel = new Date(call.createdAt).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    // ---- group call ----
    if (call._group || call.group) {
      const group = call._group || call.group;
      return (
        <div
          key={call._id}
          className="cv-row"
          onClick={() => onSelectGroup && onSelectGroup(group)}
        >
          <img src={group?.groupImage} className="cv-row-avatar" alt="" />
          <div className="flex-grow-1">
            <div className="cv-row-name">{group?.groupName}</div>
            <div className="cv-row-sub">
              <i className={`fa-solid ${icon} cv-call-history-icon`}></i>
              {call.caller?.name || "Someone"} started a {call.callType} call
            </div>
          </div>
          <span className="cv-call-history-time">{timeLabel}</span>
        </div>
      );
    }

    // ---- private call ----
    const callerId = call.caller?._id || call.caller;
    const isOutgoing = callerId === user?._id;
    const other =
      allUsers.find((u) => u._id === call._otherUserId) ||
      (isOutgoing ? call.receiver : call.caller);
    const isMissedLike = call.status === "missed" || call.status === "rejected";

    let statusLabel;
    if (call.status === "missed") {
      statusLabel = isOutgoing ? "No answer" : "Missed";
    } else if (call.status === "rejected") {
      statusLabel = isOutgoing ? "Declined" : "You declined";
    } else {
      statusLabel = isOutgoing ? "Outgoing" : "Incoming";
    }

    return (
      <div key={call._id} className="cv-row" onClick={() => other && openPrivateChat(other)}>
        <div className="cv-avatar-wrap">
          <img src={other?.image} className="cv-row-avatar" alt="" />
          {isOnline && other && isOnline(other._id) && <span className="cv-online-dot"></span>}
        </div>
        <div className="flex-grow-1">
          <div className="cv-row-name">{other?.name}</div>
          <div className={`cv-row-sub ${isMissedLike ? "cv-call-missed-text" : ""}`}>
            <i className={`fa-solid ${icon} cv-call-history-icon`}></i>
            {statusLabel} · {call.callType}
          </div>
        </div>
        <span className="cv-call-history-time">{timeLabel}</span>
      </div>
    );
  };

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

        <button
          type="button"
          className={activeTab === "calls" ? "active" : ""}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("calls");
          }}
        >
          Calls
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

      {activeTab !== "calls" && (
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
        </div>
      )}

      <div className="cv-list">
        {activeTab === "calls" ? (
          callHistoryLoading ? (
            <div className="cv-empty-list">Loading...</div>
          ) : callHistory.length > 0 ? (
            callHistory.map(renderCallRow)
          ) : (
            <div className="cv-empty-list">No calls yet</div>
          )
        ) : loading ? (
          <div className="cv-empty-list">Loading...</div>
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
                          : `${group.members?.length || 0} members`}
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

              {hasMore && (
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
              {isSearchMode ? "No groups found" : "No groups yet"}
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

            {hasMore && (
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
            {isSearchMode ? "No users found" : "No users found"}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;