import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket/Socket"; 
import Swal from "sweetalert2";
import { toast } from "react-toastify";

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
  onOpenCreateGroup,
  onOpenJoinGroup,
}) => {
  const navigate = useNavigate();

  const [showFabMenu, setShowFabMenu] = useState(false);
  const fabMenuRef = useRef(null);

  const [selectedItem, setSelectedItem] = useState(null); // { type: "group" | "user", id: string, data: object }
  const [blockedUsers, setBlockedUsers] = useState([]);

  const fetchBlockedUsers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/blocked-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setBlockedUsers(res.data.map((u) => u._id || u));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const isUserBlocked = (id) => blockedUsers.includes(id);

  // Clear selection on tab switch
  useEffect(() => {
    setSelectedItem(null);
  }, [activeTab]);

  const longPressTimerRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);
  const lastLongPressTimeRef = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startPressTimer = (item, type) => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      lastLongPressTimeRef.current = Date.now();
      if (navigator.vibrate) {
        try {
          navigator.vibrate(45);
        } catch (_) {}
      }
      setSelectedItem({ type, id: item._id, data: item });
    }, 450);
  };

  const cancelPressTimer = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleTouchEnd = (e) => {
    cancelPressTimer();
    if (isLongPressTriggeredRef.current) {
      if (e && e.cancelable) {
        e.preventDefault();
      }
      setTimeout(() => {
        isLongPressTriggeredRef.current = false;
      }, 350);
    }
  };

  useEffect(() => {
    const handleClickOutsideFab = (e) => {
      if (fabMenuRef.current && !fabMenuRef.current.contains(e.target)) {
        setShowFabMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideFab);
    return () => document.removeEventListener("mousedown", handleClickOutsideFab);
  }, []);

  const handleOpenCreateGroup = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowFabMenu(false);
    if (onOpenCreateGroup) {
      onOpenCreateGroup();
    }
  };

  const handleOpenJoinGroup = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowFabMenu(false);
    if (onOpenJoinGroup) {
      onOpenJoinGroup();
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const [pinnedChats, setPinnedChats] = useState([]);

  const [listResults, setListResults] = useState([]);
  const [listPage, setListPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const requestIdRef = useRef(0);
  const activeTabRef = useRef(activeTab);
  const isFirstRefreshSignalRef = useRef(true);

  const fetchPinnedChats = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/pinned-chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.pinnedChats)) {
        setPinnedChats(res.data.pinnedChats);
      }
    } catch (err) {
      console.error("Failed to fetch pinned chats:", err);
    }
  }, []);

  useEffect(() => {
    fetchPinnedChats();
  }, [fetchPinnedChats]);

  const handleTogglePinChat = async (e, chatId, chatType) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return;

    setPinnedChats((prev) => {
      const exists = prev.some(
        (p) => p.chatId.toString() === chatId.toString() && p.chatType === chatType
      );
      if (exists) {
        return prev.filter(
          (p) => !(p.chatId.toString() === chatId.toString() && p.chatType === chatType)
        );
      }
      return [...prev, { chatId: chatId.toString(), chatType, pinnedAt: new Date() }];
    });

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/users/toggle-pin-chat`,
        { chatId, chatType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && Array.isArray(res.data.pinnedChats)) {
        setPinnedChats(res.data.pinnedChats);
      }
    } catch (err) {
      console.error("Toggle pin chat error:", err);
      fetchPinnedChats();
    }
  };

  const isItemSelectedPinned = useMemo(() => {
    if (!selectedItem) return false;
    return pinnedChats.some(
      (p) => p.chatId.toString() === selectedItem.id.toString() && p.chatType === selectedItem.type
    );
  }, [selectedItem, pinnedChats]);

  const handleSidebarBlockUser = async () => {
    if (!selectedItem || selectedItem.type !== "user") return;
    const targetUser = selectedItem.data;
    const blocked = isUserBlocked(targetUser._id);

    Swal.fire({
      title: blocked ? "Unblock User?" : "Block User?",
      text: blocked
        ? "You will start receiving messages from this user again."
        : "You won't receive messages from this user anymore.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      confirmButtonText: blocked ? "Unblock" : "Block",
      background: "#0e1326",
      color: "#f8fafc",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const token = localStorage.getItem("token");
        const url = blocked
          ? `${API_BASE_URL}/api/users/unblock/${targetUser._id}`
          : `${API_BASE_URL}/api/users/block/${targetUser._id}`;
        await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
        setBlockedUsers((prev) =>
          blocked ? prev.filter((id) => id !== targetUser._id) : [...prev, targetUser._id]
        );
        toast.success(blocked ? "User unblocked" : "User blocked");
        setSelectedItem(null);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update block status");
      }
    });
  };

  const handleSidebarDeleteChat = async () => {
    if (!selectedItem) return;
    const token = localStorage.getItem("token");

    if (selectedItem.type === "user") {
      const targetUser = selectedItem.data;
      const chatId = privateChatMap?.[targetUser._id];

      Swal.fire({
        title: "Delete Chat?",
        text: "Are you sure you want to delete this chat history? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Delete",
        background: "#0e1326",
        color: "#f8fafc",
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        try {
          if (chatId) {
            await axios.delete(`${API_BASE_URL}/api/private/delete-chat/${chatId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          toast.success("Chat deleted");
          fetchList(debouncedTerm, 1, false);
          setSelectedItem(null);
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to delete chat");
        }
      });
    } else {
      // Group
      const group = selectedItem.data;
      const isCreator = (group.createdBy?._id || group.createdBy)?.toString() === user?._id?.toString();

      Swal.fire({
        title: isCreator ? "Delete Group?" : "Leave Group?",
        text: isCreator
          ? "Are you sure you want to permanently delete this group?"
          : "Are you sure you want to leave this group?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: isCreator ? "Delete Group" : "Leave Group",
        background: "#0e1326",
        color: "#f8fafc",
      }).then(async (result) => {
        if (!result.isConfirmed) return;
        try {
          if (isCreator) {
            await axios.delete(`${API_BASE_URL}/api/user/delete-group/${group._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Group deleted");
          } else {
            await axios.put(
              `${API_BASE_URL}/api/users/leave-group`,
              { groupId: group._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("You left the group");
          }
          fetchList(debouncedTerm, 1, false);
          setSelectedItem(null);
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed action on group");
        }
      });
    }
  };

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
          .then((res) => {
            const calls = res.data?.calls || res.data || [];
            return calls.map((c) => ({ ...c, _group: g }));
          })
          .catch((err) => {
            console.error(`group call-logs failed for ${g._id}:`, err);
            return [];
          })
      );

      const privateChatEntries = Object.entries(privateChatMap || {}); // [otherUserId, chatId]

      // debug — agar ye empty hai, matlab privateChatMap abhi tak populate
      // nahi hua tha jab Calls tab khula (root cause of "private calls not showing")
      console.log("privateChatEntries for call history:", privateChatEntries);

      const privateCallPromises = privateChatEntries.map(([otherId, chatId]) =>
        axios
          .get(`${API_BASE_URL}/api/private/call-logs/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const calls = res.data?.calls || res.data || [];
            return calls.map((c) => ({ ...c, _otherUserId: otherId }));
          })
          .catch((err) => {
            console.error(`private call-logs failed for chat ${chatId}:`, err);
            return [];
          })
      );

      const results = await Promise.all([...groupCallPromises, ...privateCallPromises]);

      if (currentRequestId !== callHistoryRequestIdRef.current) return;

      const merged = results
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      console.log("merged call history:", merged);

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
    // privateChatMap ke populate hone ke baad bhi (agar tab already khula
    // hai) automatically refetch ho jayega, kyunki fetchAllCallHistory ki
    // identity privateChatMap change hone par badalti hai — isliye ye
    // effect dobara chalta hai jab bhi fetchAllCallHistory naya banta hai
  }, [activeTab, fetchAllCallHistory]);

  // Calls button pe click karte hi bhi ek force-refetch — taaki agar user
  // Calls tab pe already khada tha aur privateChatMap late aaya, to bhi
  // agla click turant latest data le aaye
  const handleCallsTabClick = (e) => {
    e.preventDefault();
    setActiveTab("calls");
    fetchAllCallHistory();
  };

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

      const params =
        activeTab === "groups"
          ? { search: term, page, limit: PAGE_LIMIT }
          : { search: term, all: "true" };

      try {
        const { data } = await axios.get(url, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });


        if (currentRequestId !== requestIdRef.current) return;

        const items = activeTab === "groups" ? data.groups : data.users;

        setListResults((prev) => (append ? [...prev, ...(items || [])] : (items || [])));
        setHasMore(activeTab === "groups" ? Boolean(data.pagination?.hasMore) : false);
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

  // ============== REAL-TIME: auto-add sender/group to active sidebar list on incoming message ==============
  useEffect(() => {
    const handleSidebarPrivateMsg = (msg) => {
      if (!msg) return;
      const currentUserId = user?._id?.toString();
      const senderId = (msg.sender?._id || msg.sender)?.toString();
      const receiverId = (msg.receiver?._id || msg.receiver)?.toString();
      const otherId = senderId === currentUserId ? receiverId : senderId;
      if (!otherId) return;

      if (activeTabRef.current === "chats") {
        setListResults((prev) => {
          const exists = prev.some((u) => u._id.toString() === otherId);
          if (!exists) {
            const foundUser =
              allUsers.find((u) => u._id.toString() === otherId) ||
              (typeof msg.sender === "object" && msg.sender?._id?.toString() === otherId ? msg.sender : null) ||
              (typeof msg.receiver === "object" && msg.receiver?._id?.toString() === otherId ? msg.receiver : null);
            if (foundUser) {
              return [foundUser, ...prev];
            }
          }
          return [...prev];
        });
      }
    };

    const handleSidebarGroupMsg = (msg) => {
      if (!msg) return;
      const gId = (msg.group?._id || msg.group || msg.groupId)?.toString();
      if (!gId) return;

      if (activeTabRef.current === "groups") {
        setListResults((prev) => {
          const exists = prev.some((g) => g._id.toString() === gId);
          if (!exists) {
            const foundGroup =
              groups.find((g) => g._id.toString() === gId) ||
              (typeof msg.group === "object" && msg.group?._id?.toString() === gId ? msg.group : null);
            if (foundGroup) {
              return [foundGroup, ...prev];
            }
          }
          return [...prev];
        });
      }
    };

    socket.on("receivePrivateMessage", handleSidebarPrivateMsg);
    socket.on("receiveMessage", handleSidebarGroupMsg);

    return () => {
      socket.off("receivePrivateMessage", handleSidebarPrivateMsg);
      socket.off("receiveMessage", handleSidebarGroupMsg);
    };
  }, [user?._id, allUsers, groups]);

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
      const isAPinned = pinnedChats.some(
        (p) => p.chatId.toString() === a._id.toString() && p.chatType === "group"
      );
      const isBPinned = pinnedChats.some(
        (p) => p.chatId.toString() === b._id.toString() && p.chatType === "group"
      );

      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;

      const ta =
        groupLastActivity[a._id] ??
        new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb =
        groupLastActivity[b._id] ??
        new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [activeTab, listResults, isSearchMode, groupLastActivity, pinnedChats]);

  const displayedUsers = useMemo(() => {
    const base = activeTab === "chats" ? listResults : [];
    if (isSearchMode) return base;

    return [...base].sort((a, b) => {
      const isAPinned = pinnedChats.some(
        (p) => p.chatId.toString() === a._id.toString() && p.chatType === "user"
      );
      const isBPinned = pinnedChats.some(
        (p) => p.chatId.toString() === b._id.toString() && p.chatType === "user"
      );

      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;

      const ta =
        userLastActivity[a._id] ??
        new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb =
        userLastActivity[b._id] ??
        new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [activeTab, listResults, isSearchMode, userLastActivity, pinnedChats]);

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

  const handleManualRefresh = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      socket.emit("getOnlineUsers");
      if (user?._id) {
        socket.emit("userOnline", user._id);
      }
      fetchPinnedChats();
      fetchBlockedUsers();

      if (activeTab === "calls") {
        await fetchAllCallHistory();
      } else {
        await fetchList(debouncedTerm, 1, false);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 400);
    }
  };

  const handleRowClick = (item, type) => {
    if (isLongPressTriggeredRef.current || (Date.now() - lastLongPressTimeRef.current < 400)) {
      isLongPressTriggeredRef.current = false;
      return;
    }

    if (selectedItem) {
      if (selectedItem.id.toString() === item._id.toString() && selectedItem.type === type) {
        setSelectedItem(null);
      } else {
        setSelectedItem({ type, id: item._id, data: item });
      }
      return;
    }

    if (type === "group") {
      if (searchTerm) {
        setSearchTerm("");
        setDebouncedTerm("");
      }
      if (onSelectGroup) {
        onSelectGroup(item);
      } else {
        setShowGroupInfo?.(false);
        setShowMedia?.(false);
        setPreviewImage?.(null);
        setSelectedGroup?.(item);
        setSelectedUser?.(null);
      }
    } else if (type === "user") {
      if (searchTerm) {
        setSearchTerm("");
        setDebouncedTerm("");
      }
      if (openPrivateChat) {
        openPrivateChat(item);
      }
    }
  };

  return (
    <div className="cv-sidebar">
      {/* WhatsApp Style Selection Top Action Bar (Absolute Overlay) */}
      {selectedItem && (
        <div className="cv-sidebar-selection-bar">
          <div className="cv-selection-left">
            <button
              type="button"
              className="cv-selection-close-btn"
              onClick={() => setSelectedItem(null)}
              title="Cancel selection"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="cv-selection-info">
              <span className="cv-selection-count">1</span>
              <span className="cv-selection-name">
                {selectedItem.type === "group"
                  ? selectedItem.data?.groupName
                  : selectedItem.data?.name}
              </span>
            </div>
          </div>

          <div className="cv-selection-actions">
            {/* Pin / Unpin */}
            <button
              type="button"
              className={`cv-selection-action-btn ${isItemSelectedPinned ? "active" : ""}`}
              onClick={(e) => {
                handleTogglePinChat(e, selectedItem.id, selectedItem.type);
                setSelectedItem(null);
              }}
              title={isItemSelectedPinned ? "Unpin chat" : "Pin chat"}
            >
              <i className={`fa-solid ${isItemSelectedPinned ? "fa-thumbtack-slash" : "fa-thumbtack"}`}></i>
            </button>

            {/* Block / Unblock (user chats only) */}
            {selectedItem.type === "user" && (
              <button
                type="button"
                className={`cv-selection-action-btn ${isUserBlocked(selectedItem.id) ? "active" : ""}`}
                onClick={handleSidebarBlockUser}
                title={isUserBlocked(selectedItem.id) ? "Unblock User" : "Block User"}
              >
                <i className={`fa-solid ${isUserBlocked(selectedItem.id) ? "fa-unlock" : "fa-ban"}`}></i>
              </button>
            )}

            {/* Delete / Leave */}
            <button
              type="button"
              className="cv-selection-action-btn danger"
              onClick={handleSidebarDeleteChat}
              title={selectedItem.type === "group" ? "Delete / Leave Group" : "Delete Chat"}
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      )}

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
          className="cv-me-card d-none d-md-flex"
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

      <div className="cv-dial-row">
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
            onClick={handleCallsTabClick}
          >
            Calls
          </button>
        </div>

        <button
          type="button"
          className="cv-tab-refresh-btn"
          onClick={handleManualRefresh}
          title="Refresh section"
          disabled={isRefreshing}
        >
          <i className={`fa-solid fa-arrows-rotate ${isRefreshing ? "fa-spin" : ""}`}></i>
        </button>
      </div>

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
          {searchTerm && (
            <button
              type="button"
              className="cv-search-clear-btn"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
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
                const isPinned = pinnedChats.some(
                  (p) => p.chatId.toString() === group._id.toString() && p.chatType === "group"
                );
                const isSelected =
                  selectedItem?.id?.toString() === group._id.toString() &&
                  selectedItem?.type === "group";

                return (
                  <div
                    key={group._id}
                    className={`cv-row ${isPinned ? "is-pinned-row" : ""} ${isSelected ? "is-selected-item" : ""}`}
                    onClick={() => handleRowClick(group, "group")}
                    onMouseDown={() => startPressTimer(group, "group")}
                    onMouseUp={cancelPressTimer}
                    onMouseLeave={cancelPressTimer}
                    onTouchStart={() => startPressTimer(group, "group")}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={cancelPressTimer}
                    onTouchMove={cancelPressTimer}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedItem({ type: "group", id: group._id, data: group });
                    }}
                  >
                    <div className="cv-avatar-wrap">
                      <img
                        src={group.groupImage}
                        className="cv-row-avatar"
                        alt=""
                      />
                      {isSelected && (
                        <span className="cv-row-select-check">
                          <i className="fa-solid fa-circle-check"></i>
                        </span>
                      )}
                    </div>

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

                    <div className="cv-row-actions">
                      <button
                        type="button"
                        className={`cv-sidebar-pin-btn ${isPinned ? "is-pinned" : ""}`}
                        onClick={(e) => handleTogglePinChat(e, group._id, "group")}
                        title={isPinned ? "Unpin group" : "Pin group to top"}
                      >
                        <i className="fa-solid fa-thumbtack"></i>
                      </button>

                      {unreadCount > 0 ? (
                        <span className="cv-unread-badge">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : isPinned ? (
                        <span className="cv-row-pinned-indicator" title="Pinned to top">
                          <i className="fa-solid fa-thumbtack"></i>
                        </span>
                      ) : (
                        <i className="fa-solid fa-chevron-right cv-row-chevron"></i>
                      )}
                    </div>
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
              const isPinned = pinnedChats.some(
                (p) => p.chatId.toString() === u._id.toString() && p.chatType === "user"
              );
              const isSelected =
                selectedItem?.id?.toString() === u._id.toString() &&
                selectedItem?.type === "user";

              return (
                <div
                  key={u._id}
                  className={`cv-row ${isPinned ? "is-pinned-row" : ""} ${isSelected ? "is-selected-item" : ""}`}
                  onClick={() => handleRowClick(u, "user")}
                  onMouseDown={() => startPressTimer(u, "user")}
                  onMouseUp={cancelPressTimer}
                  onMouseLeave={cancelPressTimer}
                  onTouchStart={() => startPressTimer(u, "user")}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={cancelPressTimer}
                  onTouchMove={cancelPressTimer}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedItem({ type: "user", id: u._id, data: u });
                  }}
                >
                  <div className="cv-avatar-wrap">
                    <img src={u.image} className="cv-row-avatar" alt="" />
                    {isSelected ? (
                      <span className="cv-row-select-check">
                        <i className="fa-solid fa-circle-check"></i>
                      </span>
                    ) : (
                      isOnline && isOnline(u._id) && (
                        <span className="cv-online-dot"></span>
                      )
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

                  <div className="cv-row-actions">
                    <button
                      type="button"
                      className={`cv-sidebar-pin-btn ${isPinned ? "is-pinned" : ""}`}
                      onClick={(e) => handleTogglePinChat(e, u._id, "user")}
                      title={isPinned ? "Unpin chat" : "Pin chat to top"}
                    >
                      <i className="fa-solid fa-thumbtack"></i>
                    </button>

                    {unreadCount > 0 ? (
                      <span className="cv-unread-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : isPinned ? (
                      <span className="cv-row-pinned-indicator" title="Pinned to top">
                        <i className="fa-solid fa-thumbtack"></i>
                      </span>
                    ) : (
                      <i className="fa-solid fa-chevron-right cv-row-chevron"></i>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="cv-empty-list">
            {isSearchMode ? "No users found" : "No users found"}
          </div>
        )}
      </div>

      {/* WhatsApp Style Sticky Bottom-Right FAB with Dropdown Menu */}
      <div className="cv-whatsapp-fab-container" ref={fabMenuRef}>
        {showFabMenu && (
          <div className="cv-fab-popup-menu">
            <button
              type="button"
              className="cv-fab-popup-item"
              onClick={handleOpenCreateGroup}
            >
              <div className="cv-fab-item-icon emerald">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <div className="cv-fab-item-text">
                <span className="cv-fab-item-title">New Group</span>
                <span className="cv-fab-item-sub">Create squad channel</span>
              </div>
            </button>

            <button
              type="button"
              className="cv-fab-popup-item"
              onClick={handleOpenJoinGroup}
            >
              <div className="cv-fab-item-icon cyan">
                <i className="fa-solid fa-right-to-bracket"></i>
              </div>
              <div className="cv-fab-item-text">
                <span className="cv-fab-item-title">Join Group</span>
                <span className="cv-fab-item-sub">Enter invite code</span>
              </div>
            </button>
          </div>
        )}

        <button
          type="button"
          className={`cv-whatsapp-fab-btn ${showFabMenu ? "open" : ""}`}
          onClick={() => setShowFabMenu((prev) => !prev)}
          title={showFabMenu ? "Close menu" : "Create or Join Group"}
          aria-label="Create or Join Group"
        >
          <i className={`fa-solid ${showFabMenu ? "fa-xmark" : "fa-plus"}`}></i>
        </button>
      </div>
    </div>
  );
};

export default SideBar;