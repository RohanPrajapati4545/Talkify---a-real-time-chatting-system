import React, { useState, useRef, useEffect } from "react";
import Peer from "simple-peer";
import socket from "../socket/Socket";
import { toast } from "react-toastify";

// 👇 shared ICE server config (STUN + free TURN fallback)
const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const CallManager = ({ user }) => {
  const [callState, setCallState] = useState("idle");

  const [callType, setCallType] = useState("audio");
  const [incomingData, setIncomingData] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null); // 👈 NAYA — audio-only calls ke liye
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const ringtoneRef = useRef(null);
  const noAnswerTimeoutRef = useRef(null);

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

  // ICE connection state track karne ke liye helper
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
        return;
      }

      localStreamRef.current = stream;
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: ICE_CONFIG,
      });
      peerRef.current = peer;

      attachIceDebug(peer, "CALLER");

      peer.on("signal", (signalData) => {
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
      });

      peer.on("stream", (remoteStream) => {
        console.log("🎥 CALLER — remote stream received", remoteStream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream; // 👈 NAYA
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
      setIncomingData({ fromUser, signalData });
      setRemoteUser(fromUser);
      setCallType(callType);
      setCallState("incoming");
      ringtoneRef.current?.play().catch(() => {});
    });

    socket.on("callAccepted", ({ signalData }) => {
      clearTimeout(noAnswerTimeoutRef.current);
      peerRef.current?.signal(signalData);
      setCallState("connected");
      startTimer();
    });

    socket.on("callRejected", () => {
      clearTimeout(noAnswerTimeoutRef.current);
      toast.error("Call decline kar di gayi");
      cleanupCall();
    });

    socket.on("callEnded", () => {
      cleanupCall();
    });

    return () => {
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("callEnded");
    };
  }, []);

  const acceptCall = async () => {
    ringtoneRef.current?.pause();

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
    } catch (err) {
      handleMediaError(err);
      declineCall();
      return;
    }

    localStreamRef.current = stream;
    if (myVideoRef.current) myVideoRef.current.srcObject = stream;

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: ICE_CONFIG,
    });
    peerRef.current = peer;

    attachIceDebug(peer, "RECEIVER");

    peer.on("signal", (signalData) => {
      socket.emit("answerCall", { toUserId: remoteUser._id, signalData });
    });

    peer.on("stream", (remoteStream) => {
      console.log("🎥 RECEIVER — remote stream received", remoteStream);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream; // 👈 NAYA
    });

    peer.on("close", () => cleanupCall());
    peer.on("error", (err) => {
      console.log("🔴 RECEIVER PEER ERROR:", err);
      cleanupCall();
    });

    peer.signal(incomingData.signalData);
    setCallState("connected");
    startTimer();
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
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.destroy();
    peerRef.current = null;
    localStreamRef.current = null;
    clearInterval(timerRef.current);
    clearTimeout(noAnswerTimeoutRef.current);
    setCallDuration(0);
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
      <audio ref={remoteAudioRef} autoPlay hidden muted={callType === "video"} /> {/* 👈 NAYA */}

      {callState === "incoming" && (
        <div className="cv-call-card">
          <img src={remoteUser?.image} alt="" className="cv-call-avatar" />
          <h4>{remoteUser?.name}</h4>
          <p>{callType} call aa rahi hai…</p>
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
          <p>Call ja rahi hai…</p>
          <button className="cv-call-btn decline" onClick={hangUp}>
            <i className="fa-solid fa-phone-slash"></i>
          </button>
        </div>
      )}

      {callState === "connected" && (
        <div className="cv-call-connected">
          {callType === "video" ? (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className="cv-remote-video" />
              <video ref={myVideoRef} autoPlay playsInline muted className="cv-my-video" />
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