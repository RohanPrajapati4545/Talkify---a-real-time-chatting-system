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
    console.log("✅ Fresh TURN credentials fetched:", servers);
    return servers;
  } catch (err) {
    console.log("⚠️ TURN fetch failed, falling back to static config:", err);
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

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const timerRef = useRef(null);
  const ringtoneRef = useRef(null);
  const noAnswerTimeoutRef = useRef(null);
  const startCallLockRef = useRef(false);
  const acceptCallLockRef = useRef(false);

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

  const attachIceDebug = (peer, label) => {
    peer.on("connect", () => {
      console.log(`✅ [${label}] PEER DATA CHANNEL CONNECTED`);
    });
    if (peer._pc) {
      peer._pc.oniceconnectionstatechange = () => {
        console.log(`🧊 [${label}] ICE STATE:`, peer._pc.iceConnectionState);
      };
      peer._pc.onconnectionstatechange = () => {
        console.log(`🔗 [${label}] CONNECTION STATE:`, peer._pc.connectionState);
      };
    }
  };

  useEffect(() => {
    window.__startCall = async (targetUser, type) => {
      if (peerRef.current || startCallLockRef.current || callState !== "idle") {
        console.log("Call already in progress, ignoring duplicate startCall");
        return;
      }
      startCallLockRef.current = true;

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
        console.log("🔴 CALLER PEER ERROR:", err);
        cleanupCall();
      });
    };
  }, [user]);

  useEffect(() => {
    socket.on("incomingCall", ({ fromUser, signalData, callType }) => {
      if (peerRef.current || acceptCallLockRef.current) {
        console.log("Already in a call, ignoring incoming call");
        return;
      }
      setIncomingData({ fromUser, signalData });
      setRemoteUser(fromUser);
      setCallType(callType);
      setCallState("incoming");
      ringtoneRef.current?.play().catch(() => {});
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
      toast.error("Call decline kar di gayi");
      cleanupCall();
    });

    socket.on("callEnded", () => {
      cleanupCall();
    });

    socket.on("iceCandidate", ({ signalData }) => {
      console.log("🧊 RECEIVED iceCandidate from server, peerRef exists:", !!peerRef.current, signalData);
      if (!peerRef.current) {
        console.log("⚠️ Dropped ICE candidate — no active peer yet!");
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
    if (peerRef.current || acceptCallLockRef.current) {
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
      console.log("🔴 RECEIVER PEER ERROR:", err);
      cleanupCall();
    });

    peer.signal(incomingData.signalData);
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

  const fmt = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (callState === "idle") return (
    <audio ref={ringtoneRef} src="/ringtone.mp3" loop hidden />
  );

  return (
    <div className="cv-call-overlay">
      <audio ref={ringtoneRef} src="/ringtone.mp3" loop hidden />
      <audio ref={setRemoteAudioEl} autoPlay hidden muted={callType === "video"} />

      {needsPlaybackUnlock && callState === "connected" && (
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
          🔊 Tap to enable audio/video
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
            <button className="cv-call-btn decline" onClick={hangUp}>
              <i className="fa-solid fa-phone-slash"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallManager;