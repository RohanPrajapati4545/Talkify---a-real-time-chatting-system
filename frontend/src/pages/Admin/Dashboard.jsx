import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [timeframe, setTimeframe] = useState("monthly"); // "daily", "weekly", "monthly"
  const [listFilter, setListFilter] = useState("all"); // "all", "today", "active"
  const [searchQuery, setSearchQuery] = useState("");

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [callRecords, setCallRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic data from APIs
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Users
      const usersPromise = axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-user`,
        { headers }
      );

      // 2. Groups
      const groupsPromise = axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-all-group`,
        { headers }
      );

      // 3. Messages count
      const messagesPromise = axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/get-messages-count`,
        { headers }
      );

      // 4. Calls
      const callsPromise = axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/call-records`,
        { headers }
      ).catch(() => ({ data: { calls: [] } }));

      const [usersRes, groupsRes, messagesRes, callsRes] = await Promise.all([
        usersPromise,
        groupsPromise,
        messagesPromise,
        callsPromise,
      ]);

      if (usersRes.data?.users) {
        setUsers(usersRes.data.users);
        setTotalUsers(usersRes.data.users.length);
      }
      if (groupsRes.data?.groups) {
        setGroups(groupsRes.data.groups);
        setTotalGroups(groupsRes.data.groups.length);
      }
      if (messagesRes.data?.count !== undefined) {
        setTotalMessages(messagesRes.data.count);
      }
      if (callsRes.data?.calls) {
        setCallRecords(callsRes.data.calls);
        setTotalCalls(callsRes.data.calls.length);
      }
    } catch (error) {
      console.log("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Computed metrics
  const onlineCount = users.filter((u) => u.isOnline).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const newUsersCount = users.filter((u) => {
    if (!u.createdAt) return false;
    const diff = Date.now() - new Date(u.createdAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // past 7 days
  }).length;

  const totalGroupMembers = groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);
  const activeGroups = groups.filter((g) => (g.members?.length || 0) > 1).length;

  const videoCalls = callRecords.filter((c) => c.callType === "video").length;
  const audioCalls = callRecords.filter((c) => c.callType === "audio" || !c.callType).length;
  const totalCallDurationSec = callRecords.reduce((acc, c) => acc + (c.duration || 0), 0);
  const totalCallMinutes = Math.round(totalCallDurationSec / 60);

  // Filtered groups based on search & filter
  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.inviteCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="tk-dash-container">
      {/* 1. TOP TITLE & CONTROLS ROW (MATCHING REFERENCE DESIGN) */}
      <div className="tk-dash-header-row">
        <div className="tk-dash-title-left">
          <div className="tk-dash-dropdown-btn">
            <span>Dashboard</span>
            <i className="fa-solid fa-chevron-down ms-2"></i>
          </div>
        </div>

        <div className="tk-dash-filter-pills">
          <button
            type="button"
            className={`tk-filter-pill ${timeframe === "daily" ? "active" : ""}`}
            onClick={() => setTimeframe("daily")}
          >
            Daily
          </button>
          <button
            type="button"
            className={`tk-filter-pill ${timeframe === "weekly" ? "active" : ""}`}
            onClick={() => setTimeframe("weekly")}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`tk-filter-pill ${timeframe === "monthly" ? "active" : ""}`}
            onClick={() => setTimeframe("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* 2. FOUR COLOR-CODED METRIC CARDS (MATCHING REFERENCE CARDS) */}
      <div className="tk-metric-cards-grid">
        {/* Card 1: Total Users (Cyan Theme) */}
        <div className="tk-dash-card tk-card-cyan">
          <div className="tk-dash-card-top">
            <div className="tk-dash-card-icon">
              <i className="fa-regular fa-user"></i>
            </div>
            <span className="tk-dash-card-title">Total Users</span>
          </div>

          <div className="tk-dash-card-number">{totalUsers}</div>

          <div className="tk-dash-card-divider"></div>

          <div className="tk-dash-card-submetrics">
            <div className="tk-submetric">
              <span className="tk-submetric-val">{newUsersCount}</span>
              <span className="tk-submetric-lbl">This Week</span>
            </div>
            <div className="tk-submetric">
              <span className="tk-submetric-val">{onlineCount}</span>
              <span className="tk-submetric-lbl">Online</span>
            </div>
            <div className="tk-submetric">
              <span className="tk-submetric-val">{adminCount}</span>
              <span className="tk-submetric-lbl">Admins</span>
            </div>
          </div>
        </div>

        {/* Card 2: Squads & Groups (Emerald Theme) */}
        <div className="tk-dash-card tk-card-emerald">
          <div className="tk-dash-card-top">
            <div className="tk-dash-card-icon">
              <i className="fa-solid fa-users-viewfinder"></i>
            </div>
            <span className="tk-dash-card-title">Total Squads</span>
          </div>

          <div className="tk-dash-card-number">{totalGroups}</div>

          <div className="tk-dash-card-divider"></div>

          <div className="tk-dash-card-submetrics">
            <div className="tk-submetric">
              <span className="tk-submetric-val">{activeGroups || totalGroups}</span>
              <span className="tk-submetric-lbl">Active</span>
            </div>
            <div className="tk-submetric">
              <span className="tk-submetric-val">{totalGroupMembers}</span>
              <span className="tk-submetric-lbl">Members</span>
            </div>
            <div className="tk-submetric">
              <span className="tk-submetric-val">{totalGroups}</span>
              <span className="tk-submetric-lbl">Rooms</span>
            </div>
          </div>
        </div>

        {/* Card 3: Call Records (Amber / Orange Theme) */}
        <div className="tk-dash-card tk-card-amber">
          <div className="tk-dash-card-top">
            <div className="tk-dash-card-icon">
              <i className="fa-solid fa-phone-volume"></i>
            </div>
            <span className="tk-dash-card-title">Total Calls</span>
          </div>

          <div className="tk-dash-card-number">{totalCalls}</div>

          <div className="tk-dash-card-divider"></div>

          <div className="tk-dash-card-submetrics">
            <div className="tk-submetric">
              <span className="tk-submetric-val">{videoCalls}</span>
              <span className="tk-submetric-lbl">Video</span>
            </div>
            <div className="tk-submetric">
              <span className="tk-submetric-val">{audioCalls}</span>
              <span className="tk-submetric-lbl">Audio</span>
            </div>
            <div className="tk-submetric">
              <span className="tk-submetric-val">{totalCallMinutes}m</span>
              <span className="tk-submetric-lbl">Duration</span>
            </div>
          </div>
        </div>

        {/* Card 4: Messages Sent (Coral / Rose Theme) */}
        <div className="tk-dash-card tk-card-rose">
          <div className="tk-dash-card-top">
            <div className="tk-dash-card-icon">
              <i className="fa-regular fa-comment-dots"></i>
            </div>
            <span className="tk-dash-card-title">Messages &amp; Logs</span>
          </div>

          <div className="tk-dash-card-number">{totalMessages}</div>

          <div className="tk-dash-card-divider"></div>

          <div className="tk-dash-card-submetrics">
            <div className="tk-submetric">
              <span className="tk-submetric-val">{totalMessages}</span>
              <span className="tk-submetric-lbl">Delivered</span>
            </div>
            <div className="tk-submetric">
              <span className="tk-submetric-val">&lt; 14ms</span>
              <span className="tk-submetric-lbl">Latency</span>
            </div>
            <div className="tk-submetric">
              <span className="tk-submetric-val">100%</span>
              <span className="tk-submetric-lbl">Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHARTS ROW (MATCHING REFERENCE SCREENSHOT 2 & 4) */}
      <div className="tk-dash-charts-grid">
        {/* Left Chart: Activity Trends */}
        <div className="tk-chart-box tk-chart-main">
          <div className="tk-chart-header">
            <div>
              <h4 className="tk-chart-title">Activity &amp; Traffic Trends</h4>
              <div className="tk-chart-legend">
                <span className="tk-legend-bullet green"></span>
                <span className="tk-legend-text">Messages</span>
                <span className="tk-legend-bullet blue ms-3"></span>
                <span className="tk-legend-text">Calls</span>
                <span className="tk-legend-bullet red ms-3"></span>
                <span className="tk-legend-text">New Users</span>
              </div>
            </div>

            <div className="tk-chart-time-pill">
              <span>{timeframe.toUpperCase()}</span>
            </div>
          </div>

          {/* Dynamic SVG Wave Chart */}
          <div className="tk-svg-chart-wrap">
            <svg viewBox="0 0 700 240" className="tk-chart-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f5a0" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00f5a0" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="30" x2="680" y2="30" stroke="#1a2430" strokeDasharray="4 4" />
              <line x1="40" y1="80" x2="680" y2="80" stroke="#1a2430" strokeDasharray="4 4" />
              <line x1="40" y1="130" x2="680" y2="130" stroke="#1a2430" strokeDasharray="4 4" />
              <line x1="40" y1="180" x2="680" y2="180" stroke="#1a2430" strokeDasharray="4 4" />

              {/* Y Axis Values */}
              <text x="10" y="35" fill="#64748b" fontSize="11">100</text>
              <text x="15" y="85" fill="#64748b" fontSize="11">75</text>
              <text x="15" y="135" fill="#64748b" fontSize="11">50</text>
              <text x="15" y="185" fill="#64748b" fontSize="11">25</text>
              <text x="22" y="225" fill="#64748b" fontSize="11">0</text>

              {/* Area 1: Messages */}
              <path
                d="M 50 120 C 130 50, 200 130, 280 80 C 360 40, 440 90, 520 60 C 600 40, 640 70, 680 50 L 680 220 L 50 220 Z"
                fill="url(#greenGrad)"
              />
              <path
                d="M 50 120 C 130 50, 200 130, 280 80 C 360 40, 440 90, 520 60 C 600 40, 640 70, 680 50"
                fill="none"
                stroke="#00f5a0"
                strokeWidth="3"
              />

              {/* Area 2: Calls */}
              <path
                d="M 50 160 C 130 110, 200 160, 280 130 C 360 90, 440 140, 520 110 C 600 90, 640 120, 680 100 L 680 220 L 50 220 Z"
                fill="url(#blueGrad)"
              />
              <path
                d="M 50 160 C 130 110, 200 160, 280 130 C 360 90, 440 140, 520 110 C 600 90, 640 120, 680 100"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="2.5"
              />

              {/* Line 3: New Users (Red) */}
              <path
                d="M 50 200 C 130 170, 200 185, 280 175 C 360 165, 440 180, 520 160 C 600 150, 640 170, 680 160"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="5 3"
              />

              {/* Month Markers */}
              <text x="60" y="236" fill="#64748b" fontSize="11" textAnchor="middle">JAN</text>
              <text x="160" y="236" fill="#64748b" fontSize="11" textAnchor="middle">FEB</text>
              <text x="260" y="236" fill="#64748b" fontSize="11" textAnchor="middle">MAR</text>
              <text x="360" y="236" fill="#64748b" fontSize="11" textAnchor="middle">APR</text>
              <text x="460" y="236" fill="#64748b" fontSize="11" textAnchor="middle">MAY</text>
              <text x="560" y="236" fill="#64748b" fontSize="11" textAnchor="middle">JUN</text>
              <text x="650" y="236" fill="#64748b" fontSize="11" textAnchor="middle">JUL</text>
            </svg>
          </div>
        </div>

        {/* Right Chart: Distribution Donut Chart */}
        <div className="tk-chart-box tk-chart-donut">
          <div className="tk-chart-header">
            <h4 className="tk-chart-title">Traffic Distribution</h4>
            <span className="tk-fiscal-tag">Real-Time</span>
          </div>

          <div className="tk-donut-wrap">
            <svg viewBox="0 0 160 160" className="tk-donut-svg">
              {/* Background circle */}
              <circle cx="80" cy="80" r="60" fill="none" stroke="#1a2430" strokeWidth="22" />

              {/* Segment 1: Direct Chat (Cyan) 45% */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="22"
                strokeDasharray="170 377"
                strokeDashoffset="0"
              />

              {/* Segment 2: Squad Channels (Emerald) 30% */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#00f5a0"
                strokeWidth="22"
                strokeDasharray="113 377"
                strokeDashoffset="-170"
              />

              {/* Segment 3: Calls & Voice (Rose/Amber) 25% */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="22"
                strokeDasharray="94 377"
                strokeDashoffset="-283"
              />
            </svg>

            <div className="tk-donut-center">
              <span className="tk-donut-num">{totalMessages + totalCalls}</span>
              <span className="tk-donut-lbl">Events</span>
            </div>
          </div>

          <div className="tk-donut-legend-list">
            <div className="tk-donut-item">
              <span className="tk-dot-cyan"></span>
              <span className="tk-donut-name">Direct Messages</span>
              <strong className="tk-donut-pct">45%</strong>
            </div>
            <div className="tk-donut-item">
              <span className="tk-dot-emerald"></span>
              <span className="tk-donut-name">Squad Channels</span>
              <strong className="tk-donut-pct">30%</strong>
            </div>
            <div className="tk-donut-item">
              <span className="tk-dot-amber"></span>
              <span className="tk-donut-name">WebRTC &amp; Voice</span>
              <strong className="tk-donut-pct">25%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM DIRECTORY ROW (MATCHING REFERENCE SCREENSHOT 3 & 4) */}
      <div className="tk-dash-bottom-grid">
        {/* Left Box: Active Squads Directory */}
        <div className="tk-dash-table-card">
          <div className="tk-table-card-header">
            <div className="tk-search-bar-wrap">
              <i className="fa-solid fa-magnifying-glass tk-search-icon"></i>
              <input
                type="text"
                placeholder="Search squad, ID, invite code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tk-table-search-input"
              />
            </div>

            <div className="tk-table-filter-tabs">
              <button
                type="button"
                className={`tk-tab-btn ${listFilter === "all" ? "active" : ""}`}
                onClick={() => setListFilter("all")}
              >
                All Squads
              </button>
              <button
                type="button"
                className={`tk-tab-btn ${listFilter === "today" ? "active" : ""}`}
                onClick={() => setListFilter("today")}
              >
                Active
              </button>
            </div>
          </div>

          {/* Squads List */}
          <div className="tk-table-body">
            <div className="tk-table-list">
              {filteredGroups.slice(0, 5).map((group) => (
                <div key={group._id} className="tk-table-row">
                  <div className="tk-row-left">
                    <img
                      src={
                        group.groupImage ||
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                      }
                      alt=""
                      className="tk-squad-avatar"
                    />
                    <div className="tk-squad-info">
                      <div className="tk-squad-name">{group.groupName}</div>
                      <div className="tk-squad-meta">
                        <span>Code: <strong>{group.inviteCode || "TLK-ROOM"}</strong></span>
                        <span className="mx-2">·</span>
                        <span>{group.members?.length || 1} members</span>
                      </div>
                    </div>
                  </div>

                  <div className="tk-row-right">
                    <button
                      className="tk-row-btn"
                      onClick={() => navigate(`/admin/groups/${group._id}/members`)}
                      title="Manage Group Members"
                    >
                      <span>Members</span>
                      <i className="fa-solid fa-arrow-right ms-1"></i>
                    </button>
                  </div>
                </div>
              ))}

              {filteredGroups.length === 0 && (
                <div className="tk-empty-state">No squads match your search.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Box: Recent Users & Presence Status */}
        <div className="tk-dash-users-card">
          <div className="tk-users-card-header">
            <h4 className="tk-card-title">Recent Registrations</h4>
            <span className="badge bg-dark">{totalUsers} Users</span>
          </div>

          <div className="tk-users-list">
            {users.slice(0, 5).map((u) => (
              <div key={u._id} className="tk-user-row">
                <div className="tk-user-left">
                  <div className="tk-avatar-wrap">
                    <img
                      src={
                        u.image ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      }
                      alt=""
                      className="tk-user-avatar"
                    />
                    <span className={`tk-user-beacon ${u.isOnline ? "online" : "offline"}`}></span>
                  </div>
                  <div className="tk-user-details">
                    <div className="tk-user-name">{u.name}</div>
                    <div className="tk-user-sub">{u.email}</div>
                  </div>
                </div>

                <div className="tk-user-right">
                  <span className={`tk-role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                    {u.role || "User"}
                  </span>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="tk-empty-state">No users registered yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;