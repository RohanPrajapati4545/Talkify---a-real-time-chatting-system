import React, { useState, useRef, useEffect } from "react";
import Peer from "simple-peer";
import socket from "../socket/Socket";
import { toast } from "react-toastify";

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: process.env.REACT_APP_TURN_USERNAME,
      credential: process.env.REACT_APP_TURN_CREDENTIAL,
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: process.env.REACT_APP_TURN_USERNAME,
      credential: process.env.REACT_APP_TURN_CREDENTIAL,
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: process.env.REACT_APP_TURN_USERNAME,
      credential: process.env.REACT_APP_TURN_CREDENTIAL,
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: process.env.REACT_APP_TURN_USERNAME,
      credential: process.env.REACT_APP_TURN_CREDENTIAL,
    },
  ],
};

const getIceServers = async () => {
  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/turn-credentials`);
    const data = await res.json();
    const servers = Array.isArray(data) ? data : data?.iceServers;
    if (!servers || servers.length === 0) throw new Error("Empty ICE servers");
    console.log(" Fresh TURN credentials fetched:", servers);
    return servers;
  } catch (err) {
    console.log(" TURN fetch failed, falling back to static config:", err);
    return ICE_CONFIG.iceServers;
  }
};

const CallManager = ({ user }) => {
  const [callState, setCallState] = useState("idle");
  const [callType, setCallType] = useState("audio");
  const [incomingData, setIncomingData] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [needsPlaybackUnlock, setNeedsPlaybackUnlock] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const switchingCameraRef = useRef(false);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const timerRef = useRef(null);
  const ringtoneRef = useRef(null);
  const busyToneRef = useRef(null);
  const noAnswerTimeoutRef = useRef(null);
  const startCallLockRef = useRef(false);
  const acceptCallLockRef = useRef(false);
  const pendingCandidatesRef = useRef([]);

  //   NAYA — call-log ke liye live values ko refs me sync rakhte hain,
  // taaki socket.on() callbacks (jo purani closures ho sakti hain) bhi
  // hamesha latest remoteUser/callType/callDuration/callState padh sakein
  const remoteUserRef = useRef(null);
  const callTypeRef = useRef("audio");
  const callDurationRef = useRef(0);
  const callStateRef = useRef("idle");
  const isCallerRef = useRef(false); // maine call start ki thi ya receive ki
  const callOutcomeRef = useRef(null); // "missed" | "rejected" | "answered"

  useEffect(() => { remoteUserRef.current = remoteUser; }, [remoteUser]);
  useEffect(() => { callTypeRef.current = callType; }, [callType]);
  useEffect(() => { callDurationRef.current = callDuration; }, [callDuration]);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const [groupCallState, setGroupCallState] = useState("idle");
  const [groupCallType, setGroupCallType] = useState("audio");
  const [groupIncomingData, setGroupIncomingData] = useState(null);
  const [activeGroupInfo, setActiveGroupInfo] = useState(null);
  const [groupParticipants, setGroupParticipants] = useState({});
  const [groupDuration, setGroupDuration] = useState(0);
  const [groupMicOn, setGroupMicOn] = useState(true);
  const [groupCamOn, setGroupCamOn] = useState(true);
  const [groupFacingMode, setGroupFacingMode] = useState("user");
  const switchingGroupCameraRef = useRef(false);

  const groupLocalStreamRef = useRef(null);
  const groupMyVideoRef = useRef(null);
  const groupPeersRef = useRef({});
  const groupStreamsRef = useRef({});
  const groupVideoElsRef = useRef({});
  const groupIceServersRef = useRef(ICE_CONFIG.iceServers);
  const groupTimerRef = useRef(null);
  const groupCallLockRef = useRef(false);
  const groupCallActiveRef = useRef(false);

  //  NAYA — group call log ke liye refs
  const activeGroupInfoRef = useRef(null);
  const groupCallTypeRef = useRef("audio");
  const groupDurationRef = useRef(0);
  const isGroupInitiatorRef = useRef(false);

  useEffect(() => { activeGroupInfoRef.current = activeGroupInfo; }, [activeGroupInfo]);
  useEffect(() => { groupCallTypeRef.current = groupCallType; }, [groupCallType]);
  useEffect(() => { groupDurationRef.current = groupDuration; }, [groupDuration]);

  const handleMediaError = (err) => {
    console.log(err);
    if (err.name === "NotAllowedError") {
      toast.error("Mic/Camera permission denied. Please allow access.");
    } else if (err.name === "NotFoundError") {
      toast.error("No mic/camera found on this device.");
    } else {
      toast.error("Could not access mic/camera.");
    }
  };

  const attachStream = (el, stream) => {
    if (!el || !stream) return;
    if (el.srcObject !== stream) el.srcObject = stream;

    const playPromise = el.play?.();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        if (err.name === "AbortError") return;
        if (err.name === "NotAllowedError") {
          console.log(`autoplay blocked for ${el.tagName}, needs user tap`);
          setNeedsPlaybackUnlock(true);
        } else {
          console.log("play blocked:", err);
        }
      });
    }
  };

  const setMyVideoEl = (el) => {
    myVideoRef.current = el;
    attachStream(el, localStreamRef.current);
  };

  const setRemoteVideoEl = (el) => {
    remoteVideoRef.current = el;
    attachStream(el, remoteStreamRef.current);
  };

  const setRemoteAudioEl = (el) => {
    remoteAudioRef.current = el;
    attachStream(el, remoteStreamRef.current);
  };

  const unlockPlayback = () => {
    setNeedsPlaybackUnlock(false);
    attachStream(remoteVideoRef.current, remoteStreamRef.current);
    attachStream(remoteAudioRef.current, remoteStreamRef.current);
  };


  const acquireCameraStream = async (newFacingMode, currentDeviceId) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    console.log(
      ` Found ${videoInputs.length} camera(s):`,
      videoInputs.map((d) => d.label || d.deviceId)
    );

    if (videoInputs.length < 2) {
      throw new Error("This device only has one camera");
    }

    const verifyDifferentCamera = (stream) => {
      const track = stream.getVideoTracks()[0];
      const gotDeviceId = track?.getSettings?.().deviceId;
      if (currentDeviceId && gotDeviceId && gotDeviceId === currentDeviceId) {
        console.log(" Got the same physical camera back, rejecting this attempt");
        track.stop();
        return false;
      }
      return true;
    };

    // Attempt 1 — exact facingMode
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { exact: newFacingMode } },
      });
      if (verifyDifferentCamera(stream)) return stream;
    } catch (err) {
      console.log("Camera exact facingMode failed:", err.name);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: newFacingMode },
      });
      if (verifyDifferentCamera(stream)) return stream;
    } catch (err) {
      console.log("Camera ideal facingMode failed:", err.name);
    }

    
    const labelHint = newFacingMode === "environment" ? ["back", "rear", "environment"] : ["front", "user", "face"];
    const byLabel = videoInputs.find((d) =>
      labelHint.some((hint) => d.label?.toLowerCase().includes(hint))
    );
    const candidates = [
      ...(byLabel ? [byLabel] : []),
      ...videoInputs.filter((d) => d.deviceId !== currentDeviceId),
      ...videoInputs,
    ];

    let lastErr;
    for (const device of candidates) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { deviceId: { exact: device.deviceId } },
        });
        if (verifyDifferentCamera(stream)) return stream;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("No working alternate camera found");
  };

  const attachIceDebug = (peer, label) => {
    peer.on("connect", () => {
      console.log(` [${label}] PEER DATA CHANNEL CONNECTED`);
    });
    if (peer._pc) {
      peer._pc.oniceconnectionstatechange = () => {
        console.log(` [${label}] ICE STATE:`, peer._pc.iceConnectionState);
      };
      peer._pc.onconnectionstatechange = () => {
        console.log(` [${label}] CONNECTION STATE:`, peer._pc.connectionState);
      };
    }
  };

  const flushPendingCandidates = (peer, label) => {
    if (pendingCandidatesRef.current.length > 0) {
      console.log(` [${label}] Flushing ${pendingCandidatesRef.current.length} buffered ICE candidates`);
      pendingCandidatesRef.current.forEach((c) => peer.signal(c));
      pendingCandidatesRef.current = [];
    }
  };

  const setGroupVideoEl = (userId) => (el) => {
    groupVideoElsRef.current[userId] = el;
    attachStream(el, groupStreamsRef.current[userId]);
  };

  const setGroupMyVideoEl = (el) => {
    groupMyVideoRef.current = el;
    attachStream(el, groupLocalStreamRef.current);
  };

  const removeGroupPeer = (userId) => {
    const peer = groupPeersRef.current[userId];
    if (peer) {
      peer.destroy();
      delete groupPeersRef.current[userId];
    }
    delete groupStreamsRef.current[userId];
    delete groupVideoElsRef.current[userId];
    setGroupParticipants((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  };

  const createGroupPeer = (groupId, remoteUserInfo, isInitiator) => {
    if (groupPeersRef.current[remoteUserInfo._id]) return groupPeersRef.current[remoteUserInfo._id];

    const peer = new Peer({
      initiator: isInitiator,
      trickle: true,
      stream: groupLocalStreamRef.current,
      config: { iceServers: groupIceServersRef.current },
    });

    groupPeersRef.current[remoteUserInfo._id] = peer;
    attachIceDebug(peer, `GROUP-${remoteUserInfo._id}`);

    setGroupParticipants((prev) => ({
      ...prev,
      [remoteUserInfo._id]: { ...(prev[remoteUserInfo._id] || {}), userInfo: remoteUserInfo },
    }));

    peer.on("signal", (signalData) => {
      socket.emit("groupSignal", {
        groupId,
        toUserId: remoteUserInfo._id,
        fromUser: user,
        signalData,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log(" GROUP — remote stream received from", remoteUserInfo._id);
      groupStreamsRef.current[remoteUserInfo._id] = remoteStream;
      attachStream(groupVideoElsRef.current[remoteUserInfo._id], remoteStream);
      setGroupParticipants((prev) => ({
        ...prev,
        [remoteUserInfo._id]: { ...(prev[remoteUserInfo._id] || {}), userInfo: remoteUserInfo, hasStream: true },
      }));
    });

    peer.on("close", () => removeGroupPeer(remoteUserInfo._id));
    peer.on("error", (err) => {
      console.log(" GROUP PEER ERROR:", remoteUserInfo._id, err);
      removeGroupPeer(remoteUserInfo._id);
    });

    return peer;
  };

  const startGroupTimer = () => {
    groupTimerRef.current = setInterval(() => setGroupDuration((d) => d + 1), 1000);
  };

  const cleanupGroupCall = () => {
    //   — agar maine hi yeh group call start ki thi (call button
    // dabaya tha), toh chhodte waqt uska log DB me save kar do
    if (isGroupInitiatorRef.current && activeGroupInfoRef.current?._id) {
      socket.emit("logGroupCall", {
        groupId: activeGroupInfoRef.current._id,
        callType: groupCallTypeRef.current,
        duration: groupDurationRef.current,
      });
    }
    isGroupInitiatorRef.current = false;

    Object.keys(groupPeersRef.current).forEach((uid) => {
      groupPeersRef.current[uid]?.destroy();
    });
    groupPeersRef.current = {};
    groupStreamsRef.current = {};
    groupVideoElsRef.current = {};

    groupLocalStreamRef.current?.getTracks().forEach((t) => t.stop());
    groupLocalStreamRef.current = null;

    if (groupMyVideoRef.current) {
      try {
        groupMyVideoRef.current.pause();
        groupMyVideoRef.current.srcObject = null;
      } catch (e) {}
    }

    clearInterval(groupTimerRef.current);
    groupCallActiveRef.current = false;
    groupCallLockRef.current = false;

    setGroupParticipants({});
    setGroupDuration(0);
    setGroupMicOn(true);
    setGroupCamOn(true);
    setGroupCallState("idle");
    setGroupIncomingData(null);
    setActiveGroupInfo(null);
    setGroupFacingMode("user");

    ringtoneRef.current?.pause();
    if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
  };

  const joinGroupCallFlow = async (group, type) => {
    if (peerRef.current || callState !== "idle" || groupCallLockRef.current) return;
    groupCallLockRef.current = true;

    ringtoneRef.current?.pause();

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
    } catch (err) {
      handleMediaError(err);
      groupCallLockRef.current = false;
      setGroupCallState("idle");
      setGroupIncomingData(null);
      return;
    }

    groupLocalStreamRef.current = stream;
    attachStream(groupMyVideoRef.current, stream);

    const iceServers = await getIceServers();
    groupIceServersRef.current = iceServers;

    setActiveGroupInfo(group);
    setGroupCallType(type);
    setGroupIncomingData(null);
    setGroupCallState("connected");
    groupCallActiveRef.current = true;
    startGroupTimer();

    socket.emit("joinGroupCall", { groupId: group._id, userInfo: user });
    groupCallLockRef.current = false;
  };

  const acceptGroupCall = async () => {
    if (!groupIncomingData) return;
    await joinGroupCallFlow(
      {
        _id: groupIncomingData.groupId,
        groupName: activeGroupInfo?.groupName,
        groupImage: activeGroupInfo?.groupImage,
      },
      groupIncomingData.callType
    );
  };

  const declineGroupCall = () => {
    if (groupIncomingData?.groupId) {
      socket.emit("leaveGroupCall", { groupId: groupIncomingData.groupId, userId: user._id });
    }
    ringtoneRef.current?.pause();
    setGroupCallState("idle");
    setGroupIncomingData(null);
    setActiveGroupInfo(null);
  };

  const leaveGroupCall = () => {
    if (activeGroupInfo?._id) {
      socket.emit("leaveGroupCall", { groupId: activeGroupInfo._id, userId: user._id });
    }
    cleanupGroupCall();
  };

  const toggleGroupMic = () => {
    const track = groupLocalStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setGroupMicOn(track.enabled);
    }
  };

  const toggleGroupCam = () => {
    const track = groupLocalStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setGroupCamOn(track.enabled);
    }
  };

  //  front/back camera switch (group video call)
  // Sabhi connected group peers me naya video track replace karte hain.
  const switchGroupCamera = async () => {
    if (groupCallType !== "video" || !groupLocalStreamRef.current || switchingGroupCameraRef.current) return;
    switchingGroupCameraRef.current = true;

    const newFacingMode = groupFacingMode === "user" ? "environment" : "user";
    const oldVideoTrack = groupLocalStreamRef.current.getVideoTracks()[0];
    const oldDeviceId = oldVideoTrack?.getSettings?.().deviceId;

    let newStream;
    try {
      newStream = await acquireCameraStream(newFacingMode, oldDeviceId);
    } catch (err) {
      console.log("Group camera switch attempt 1 failed, releasing old camera and retrying:", err);
      oldVideoTrack?.stop();
      try {
        newStream = await acquireCameraStream(newFacingMode, oldDeviceId);
      } catch (err2) {
        console.log(" Group camera switch failed completely:", err2);
        toast.error(
          err2?.message === "This device only has one camera"
            ? "This device only has one camera"
            : "Could not switch camera"
        );

        if (oldVideoTrack) {
          try {
            const restored = await acquireCameraStream(groupFacingMode, null);
            const restoredTrack = restored.getVideoTracks()[0];
            Object.values(groupPeersRef.current).forEach((peer) => {
              if (restoredTrack) {
                peer.replaceTrack(oldVideoTrack, restoredTrack, groupLocalStreamRef.current);
              }
            });
            groupLocalStreamRef.current.removeTrack(oldVideoTrack);
            groupLocalStreamRef.current.addTrack(restoredTrack);
            restoredTrack.enabled = groupCamOn;
            attachStream(groupMyVideoRef.current, groupLocalStreamRef.current);
          } catch (restoreErr) {
            console.log("Could not restore original camera:", restoreErr);
          }
        }
        switchingGroupCameraRef.current = false;
        return;
      }
    }

    const newVideoTrack = newStream.getVideoTracks()[0];

    Object.values(groupPeersRef.current).forEach((peer) => {
      if (oldVideoTrack && newVideoTrack) {
        peer.replaceTrack(oldVideoTrack, newVideoTrack, groupLocalStreamRef.current);
      }
    });

    if (oldVideoTrack) {
      oldVideoTrack.stop();
      groupLocalStreamRef.current.removeTrack(oldVideoTrack);
    }
    groupLocalStreamRef.current.addTrack(newVideoTrack);
    newVideoTrack.enabled = groupCamOn;

    attachStream(groupMyVideoRef.current, groupLocalStreamRef.current);
    setGroupFacingMode(newFacingMode);
    switchingGroupCameraRef.current = false;
  };

  useEffect(() => {
    window.__startGroupCall = async (group, type) => {
      if (peerRef.current || callState !== "idle" || groupCallActiveRef.current || groupCallLockRef.current) {
        console.log("Call already in progress, ignoring group call start");
        return;
      }
      isGroupInitiatorRef.current = true; //   NAYA — maine call start ki
      socket.emit("groupCallUser", {
        groupId: group._id,
        groupName: group.groupName,
        groupImage: group.groupImage,
        fromUser: user,
        callType: type,
      });
      await joinGroupCallFlow(group, type);
    };
  }, [user, callState]);

  useEffect(() => {
    socket.on("groupIncomingCall", ({ groupId, groupName, groupImage, fromUser, callType }) => {
      if (fromUser._id === user?._id) return;
      if (peerRef.current || groupCallActiveRef.current) {
        console.log("Already in a call, ignoring group incoming call");
        return;
      }
      isGroupInitiatorRef.current = false; //   NAYA — maine call receive ki
      setActiveGroupInfo({ _id: groupId, groupName, groupImage });
      setGroupIncomingData({ groupId, fromUser, callType });
      setGroupCallType(callType);
      setGroupCallState("incoming");
      ringtoneRef.current?.play().catch((err) => {
        console.log(" Ringtone play failed:", err.name, err.message);
      });
    });

    socket.on("groupCallParticipants", ({ groupId, participants }) => {
      participants.forEach(({ userInfo }) => {
        if (!userInfo || userInfo._id === user?._id) return;
        createGroupPeer(groupId, userInfo, true);
      });
    });

    socket.on("groupUserJoinedCall", ({ userInfo }) => {
      if (!userInfo || userInfo._id === user?._id) return;
      setGroupParticipants((prev) =>
        prev[userInfo._id] ? prev : { ...prev, [userInfo._id]: { userInfo } }
      );
    });

    socket.on("groupSignal", ({ groupId, fromUser, signalData }) => {
      let peer = groupPeersRef.current[fromUser._id];
      if (!peer) {
        peer = createGroupPeer(groupId, fromUser, false);
      }
      peer.signal(signalData);
    });

    socket.on("groupUserLeftCall", ({ userId }) => {
      removeGroupPeer(userId);
    });

    socket.on("groupCallEnded", () => {
      cleanupGroupCall();
    });

    return () => {
      socket.off("groupIncomingCall");
      socket.off("groupCallParticipants");
      socket.off("groupUserJoinedCall");
      socket.off("groupSignal");
      socket.off("groupUserLeftCall");
      socket.off("groupCallEnded");
    };
  }, [user?._id]);

  useEffect(() => {
    window.__startCall = async (targetUser, type) => {
      if (peerRef.current || startCallLockRef.current || callState !== "idle" || groupCallActiveRef.current) {
        console.log("Call already in progress, ignoring duplicate startCall");
        return;
      }
      startCallLockRef.current = true;
      isCallerRef.current = true; //   NAYA — maine call start ki
      callOutcomeRef.current = null;

      busyToneRef.current?.pause();
      if (busyToneRef.current) busyToneRef.current.currentTime = 0;

      setCallType(type);
      setRemoteUser(targetUser);
      setCallState("calling");

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
        });
      } catch (err) {
        handleMediaError(err);
        setCallState("idle");
        setRemoteUser(null);
        startCallLockRef.current = false;
        return;
      }

      if (peerRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        startCallLockRef.current = false;
        return;
      }

      localStreamRef.current = stream;
      attachStream(myVideoRef.current, stream);

      const iceServers = await getIceServers();

      if (peerRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        startCallLockRef.current = false;
        return;
      }

      const peer = new Peer({
        initiator: true,
        trickle: true,
        stream,
        config: {
          iceServers,
        },
      });
      peerRef.current = peer;
      startCallLockRef.current = false;
      attachIceDebug(peer, "CALLER");

      if (pendingCandidatesRef.current.length > 0) {
        pendingCandidatesRef.current.forEach((c) => peer.signal(c));
        pendingCandidatesRef.current = [];
      }

      let firstSignalSent = false;

      peer.on("signal", (signalData) => {
        if (!firstSignalSent) {
          firstSignalSent = true;
          socket.emit("callUser", {
            toUserId: targetUser._id,
            fromUser: user,
            signalData,
            callType: type,
          });

          noAnswerTimeoutRef.current = setTimeout(() => {
            toast.error("User is not available right now");
            socket.emit("endCall", { toUserId: targetUser._id });
            cleanupCall();
          }, 30000);
        } else {
          socket.emit("iceCandidate", {
            toUserId: targetUser._id,
            signalData,
          });
        }
      });

      peer.on("stream", (remoteStream) => {
        console.log("🎥 CALLER — remote stream received", remoteStream);
        remoteStreamRef.current = remoteStream;
        attachStream(remoteVideoRef.current, remoteStream);
        attachStream(remoteAudioRef.current, remoteStream);
      });

      peer.on("close", () => cleanupCall());
      peer.on("error", (err) => {
        console.log("CALLER PEER ERROR:", err);
        cleanupCall();
      });
    };
  }, [user, callState]);

  useEffect(() => {
    socket.on("incomingCall", ({ fromUser, signalData, callType }) => {
      if (peerRef.current || acceptCallLockRef.current || groupCallActiveRef.current) {
        console.log("Already in a call, ignoring incoming call");
        return;
      }
      isCallerRef.current = false; //   NAYA — maine call receive ki, log caller karega
      setIncomingData({ fromUser, signalData });
      setRemoteUser(fromUser);
      setCallType(callType);
      setCallState("incoming");
      ringtoneRef.current?.play().catch((err) => {
        console.log("Ringtone play failed:", err.name, err.message);
      });
    });

    socket.on("callAccepted", ({ signalData }) => {
      clearTimeout(noAnswerTimeoutRef.current);
      peerRef.current?.signal(signalData);
      setCallState((prev) => {
        if (prev !== "connected") startTimer();
        return "connected";
      });
    });

    socket.on("callRejected", () => {
      clearTimeout(noAnswerTimeoutRef.current);
      toast.error("Call declined");
      callOutcomeRef.current = "rejected"; //   NAYA
      busyToneRef.current?.play().catch((err) => {
        console.log("Busy tone play failed:", err.name, err.message);
      });
      cleanupCall();
    });

    socket.on("callEnded", () => {
      cleanupCall();
    });

    socket.on("iceCandidate", ({ signalData }) => {
      console.log("RECEIVED iceCandidate from server, peerRef exists:", !!peerRef.current, signalData);
      if (!peerRef.current) {
        pendingCandidatesRef.current.push(signalData);
        return;
      }
      peerRef.current.signal(signalData);
    });

    return () => {
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("callEnded");
      socket.off("iceCandidate");
    };
  }, []);

  const acceptCall = async () => {
    if (peerRef.current || acceptCallLockRef.current || groupCallActiveRef.current) {
      console.log("Call already in progress, ignoring duplicate acceptCall");
      return;
    }
    acceptCallLockRef.current = true;

    ringtoneRef.current?.pause();

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
    } catch (err) {
      handleMediaError(err);
      acceptCallLockRef.current = false;
      declineCall();
      return;
    }

    if (peerRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      acceptCallLockRef.current = false;
      return;
    }

    localStreamRef.current = stream;

    const iceServers = await getIceServers();

    if (peerRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      acceptCallLockRef.current = false;
      return;
    }

    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: {
        iceServers,
      },
    });
    peerRef.current = peer;
    acceptCallLockRef.current = false;
    attachIceDebug(peer, "RECEIVER");

    let firstSignalSent = false;

    peer.on("signal", (signalData) => {
      if (!firstSignalSent) {
        firstSignalSent = true;
        socket.emit("answerCall", { toUserId: remoteUser._id, signalData });
      } else {
        socket.emit("iceCandidate", {
          toUserId: remoteUser._id,
          signalData,
        });
      }
    });

    peer.on("stream", (remoteStream) => {
      console.log("🎥 RECEIVER — remote stream received", remoteStream);
      remoteStreamRef.current = remoteStream;
      attachStream(remoteVideoRef.current, remoteStream);
      attachStream(remoteAudioRef.current, remoteStream);
    });

    peer.on("close", () => cleanupCall());
    peer.on("error", (err) => {
      console.log(" RECEIVER PEER ERROR:", err);
      cleanupCall();
    });

    peer.signal(incomingData.signalData);
    flushPendingCandidates(peer, "RECEIVER");

    setCallState("connected");
    startTimer();

    attachStream(myVideoRef.current, stream);
  };

  const declineCall = () => {
    ringtoneRef.current?.pause();
    socket.emit("rejectCall", { toUserId: remoteUser._id });
    cleanupCall();
  };

  const hangUp = () => {
    if (remoteUser) socket.emit("endCall", { toUserId: remoteUser._id });
    cleanupCall();
  };

  const cleanupCall = () => {
    // 👇 NAYA — sirf jisne call start ki thi (caller) DB me log save
    // karta hai, taaki dono taraf se duplicate entry na bane. Agar
    // callOutcomeRef explicitly set nahi hai (e.g. peer error/close se
    // seedha yahan aaya), toh current call state se sahi guess kar lete hain:
    // "connected" tha toh "answered", warna "missed" (cancel/no-answer).
    if (isCallerRef.current && remoteUserRef.current?._id) {
      const outcome =
        callOutcomeRef.current ||
        (callStateRef.current === "connected" ? "answered" : "missed");

      socket.emit("logCall", {
        toUserId: remoteUserRef.current._id,
        callType: callTypeRef.current,
        status: outcome,
        duration: callDurationRef.current,
      });
    }
    isCallerRef.current = false;
    callOutcomeRef.current = null;

    [myVideoRef.current, remoteVideoRef.current, remoteAudioRef.current].forEach((el) => {
      if (!el) return;
      try {
        el.pause();
        el.srcObject = null;
      } catch (e) {
      }
    });

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.destroy();
    peerRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    clearInterval(timerRef.current);
    clearTimeout(noAnswerTimeoutRef.current);
    noAnswerTimeoutRef.current = null;
    startCallLockRef.current = false;
    acceptCallLockRef.current = false;
    setCallDuration(0);
    setNeedsPlaybackUnlock(false);
    setCallState("idle");
    setIncomingData(null);
    setRemoteUser(null);
    setFacingMode("user");
    ringtoneRef.current?.pause();
    if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

 
  const switchCamera = async () => {
    if (callType !== "video" || !localStreamRef.current || switchingCameraRef.current) return;
    switchingCameraRef.current = true;

    const newFacingMode = facingMode === "user" ? "environment" : "user";
    const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
    const oldDeviceId = oldVideoTrack?.getSettings?.().deviceId;

    let newStream;
    try {
      newStream = await acquireCameraStream(newFacingMode, oldDeviceId);
    } catch (err) {
   
      console.log("Camera switch attempt 1 failed, releasing old camera and retrying:", err);
      oldVideoTrack?.stop();
      try {
        newStream = await acquireCameraStream(newFacingMode, oldDeviceId);
      } catch (err2) {
        console.log("Camera switch failed completely:", err2);
        toast.error(
          err2?.message === "This device only has one camera"
            ? "This device only has one camera"
            : "Could not switch camera"
        );

      
        if (oldVideoTrack) {
          try {
            const restored = await acquireCameraStream(facingMode, null);
            const restoredTrack = restored.getVideoTracks()[0];
            if (peerRef.current && restoredTrack) {
              peerRef.current.replaceTrack(oldVideoTrack, restoredTrack, localStreamRef.current);
            }
            localStreamRef.current.removeTrack(oldVideoTrack);
            localStreamRef.current.addTrack(restoredTrack);
            restoredTrack.enabled = camOn;
            attachStream(myVideoRef.current, localStreamRef.current);
          } catch (restoreErr) {
            console.log(" Could not restore original camera:", restoreErr);
          }
        }
        switchingCameraRef.current = false;
        return;
      }
    }

    const newVideoTrack = newStream.getVideoTracks()[0];

    if (peerRef.current && oldVideoTrack && newVideoTrack) {
      peerRef.current.replaceTrack(oldVideoTrack, newVideoTrack, localStreamRef.current);
    }

    if (oldVideoTrack) {
      oldVideoTrack.stop();
      localStreamRef.current.removeTrack(oldVideoTrack);
    }
    localStreamRef.current.addTrack(newVideoTrack);
    newVideoTrack.enabled = camOn;

    attachStream(myVideoRef.current, localStreamRef.current);
    setFacingMode(newFacingMode);
    switchingCameraRef.current = false;
  };

  const fmt = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const groupParticipantList = Object.entries(groupParticipants);
  const groupTileCount = groupParticipantList.length + 1;
  const showOverlay = callState !== "idle" || groupCallState !== "idle";

 
  return (
    <>
      <audio ref={ringtoneRef} src="/ringtone.mp3" loop hidden preload="auto" />
      <audio ref={busyToneRef} src="/busy-tone.mp3" hidden preload="auto" />

      {showOverlay && (
        <div className="cv-call-overlay">
          <audio ref={setRemoteAudioEl} autoPlay hidden muted={callType === "video"} />

          {needsPlaybackUnlock && (callState === "connected" || groupCallState === "connected") && (
            <button
              onClick={unlockPlayback}
              style={{
                position: "fixed",
                top: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                padding: "10px 18px",
                borderRadius: "20px",
                border: "none",
                background: "#222",
                color: "#fff",
                fontSize: "14px",
              }}
            >
               Tap to enable audio/video
            </button>
          )}

          {callState === "incoming" && (
            <div className="cv-call-card">
              <img src={remoteUser?.image} alt="" className="cv-call-avatar" />
              <h4>{remoteUser?.name}</h4>
              <p>{callType} incoming call…</p>
              <div className="cv-call-actions">
                <button className="cv-call-btn accept" onClick={acceptCall}>
                  <i className="fa-solid fa-phone"></i>
                </button>
                <button className="cv-call-btn decline" onClick={declineCall}>
                  <i className="fa-solid fa-phone-slash"></i>
                </button>
              </div>
            </div>
          )}

          {callState === "calling" && (
            <div className="cv-call-card">
              <img src={remoteUser?.image} alt="" className="cv-call-avatar" />
              <h4>{remoteUser?.name}</h4>
              <p>Calling…</p>
              <button className="cv-call-btn decline" onClick={hangUp}>
                <i className="fa-solid fa-phone-slash"></i>
              </button>
            </div>
          )}

          {callState === "connected" && (
            <div className="cv-call-connected">
              {callType === "video" ? (
                <>
                  <video ref={setRemoteVideoEl} autoPlay playsInline className="cv-remote-video" />
                  <video ref={setMyVideoEl} autoPlay playsInline muted className="cv-my-video" />
                </>
              ) : (
                <div className="cv-call-card">
                  <img src={remoteUser?.image} alt="" className="cv-call-avatar" />
                  <h4>{remoteUser?.name}</h4>
                </div>
              )}

              <div className="cv-call-bar">
                <span className="cv-call-timer">{fmt(callDuration)}</span>
                <button className="cv-call-btn small" onClick={toggleMic}>
                  <i className={`fa-solid ${micOn ? "fa-microphone" : "fa-microphone-slash"}`}></i>
                </button>
                {callType === "video" && (
                  <button className="cv-call-btn small" onClick={toggleCam}>
                    <i className={`fa-solid ${camOn ? "fa-video" : "fa-video-slash"}`}></i>
                  </button>
                )}
                {callType === "video" && (
                  <button
                    className="cv-call-btn small"
                    onClick={switchCamera}
                    title="Switch camera"
                  >
                    <i className="fa-solid fa-camera-rotate"></i>
                  </button>
                )}
                <button className="cv-call-btn decline" onClick={hangUp}>
                  <i className="fa-solid fa-phone-slash"></i>
                </button>
              </div>
            </div>
          )}

          {groupCallState === "incoming" && (
            <div className="cv-call-card">
              <img src={activeGroupInfo?.groupImage} alt="" className="cv-call-avatar" />
              <h4>{activeGroupInfo?.groupName}</h4>
              <p>{groupIncomingData?.fromUser?.name} started a {groupCallType} group call…</p>
              <div className="cv-call-actions">
                <button className="cv-call-btn accept" onClick={acceptGroupCall}>
                  <i className="fa-solid fa-phone"></i>
                </button>
                <button className="cv-call-btn decline" onClick={declineGroupCall}>
                  <i className="fa-solid fa-phone-slash"></i>
                </button>
              </div>
            </div>
          )}

          {groupCallState === "connected" && (
            <div className="cv-call-connected">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(3, Math.ceil(Math.sqrt(groupTileCount)))}, 1fr)`,
                  gap: "8px",
                  width: "100%",
                  height: "100%",
                  padding: "12px",
                  boxSizing: "border-box",
                  alignContent: "center",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    background: "#111",
                    borderRadius: "12px",
                    overflow: "hidden",
                    aspectRatio: "4 / 3",
                  }}
                >
                  {groupCallType === "video" ? (
                    <video
                      ref={setGroupMyVideoEl}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      <img src={user?.image} alt="" style={{ width: "56px", height: "56px", borderRadius: "50%" }} />
                    </div>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "6px",
                      left: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      background: "rgba(0,0,0,0.5)",
                      padding: "2px 6px",
                      borderRadius: "6px",
                    }}
                  >
                    You
                  </span>
                </div>

                {groupParticipantList.map(([uid, p]) => (
                  <div
                    key={uid}
                    style={{
                      position: "relative",
                      background: "#111",
                      borderRadius: "12px",
                      overflow: "hidden",
                      aspectRatio: "4 / 3",
                    }}
                  >
                    {groupCallType === "video" ? (
                      <video
                        ref={setGroupVideoEl(uid)}
                        autoPlay
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <>
                        <audio ref={setGroupVideoEl(uid)} autoPlay hidden />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                          <img
                            src={p.userInfo?.image}
                            alt=""
                            style={{ width: "56px", height: "56px", borderRadius: "50%" }}
                          />
                        </div>
                      </>
                    )}
                    <span
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        left: "8px",
                        color: "#fff",
                        fontSize: "12px",
                        background: "rgba(0,0,0,0.5)",
                        padding: "2px 6px",
                        borderRadius: "6px",
                      }}
                    >
                      {p.userInfo?.name}{!p.hasStream ? " — connecting…" : ""}
                    </span>
                  </div>
                ))}
              </div>

              <div className="cv-call-bar">
                <span className="cv-call-timer">{fmt(groupDuration)}</span>
                <button className="cv-call-btn small" onClick={toggleGroupMic}>
                  <i className={`fa-solid ${groupMicOn ? "fa-microphone" : "fa-microphone-slash"}`}></i>
                </button>
                {groupCallType === "video" && (
                  <button className="cv-call-btn small" onClick={toggleGroupCam}>
                    <i className={`fa-solid ${groupCamOn ? "fa-video" : "fa-video-slash"}`}></i>
                  </button>
                )}
                {groupCallType === "video" && (
                  <button
                    className="cv-call-btn small"
                    onClick={switchGroupCamera}
                    title="Switch camera"
                  >
                    <i className="fa-solid fa-camera-rotate"></i>
                  </button>
                )}
                <button className="cv-call-btn decline" onClick={leaveGroupCall}>
                  <i className="fa-solid fa-phone-slash"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CallManager;