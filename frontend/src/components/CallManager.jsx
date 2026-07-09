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

// ❌ REMOVED — ye stray/unused `myPeerConnection = new RTCPeerConnection(...)`
// koi kaam nahi kar raha tha, sirf module load hote hi ek useless
// peer connection bana deta tha. Hata diya gaya.

const CallManager = ({ user }) => {
  const [callState, setCallState] = useState("idle");
  const [callType, setCallType] = useState("audio");
  const [incomingData, setIncomingData] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // 👇 NAYA — jab autoplay block ho jaye (audio/video), user ko "tap to enable" dikhate hain
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

  // 👇 NAYA — safe attach helper. Har jagah stream ko video/audio element pe
  // isi se lagao — chahe callback ref se ho ya peer "stream" event se.
  const attachStream = (el, stream) => {
    if (!el || !stream) return;
    if (el.srcObject !== stream) el.srcObject = stream;

    const playPromise = el.play?.();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        if (err.name === "AbortError") return; // element unmount hote waqt normal hai
        if (err.name === "NotAllowedError") {
          // 👇 Autoplay policy ne block kiya — user gesture chahiye
          console.log(`autoplay blocked for ${el.tagName}, needs user tap`);
          setNeedsPlaybackUnlock(true);
        } else {
          console.log("play blocked:", err);
        }
      });
    }
  };

  // 👇 NAYA — callback refs. Ye DOM mount hote hi (ya jab bhi call ho) turant
  // current stream attach kar dete hain — kisi useEffect timing pe depend nahi.
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

  // 👇 NAYA — user "Tap to enable" button dabaye to ye chalega (genuine user gesture)
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
      if (peerRef.current || callState !== "idle") {
        console.log("Call already in progress, ignoring duplicate startCall");
        return;
      }
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
      attachStream(myVideoRef.current, stream);

      const peer = new Peer({
        initiator: true,
        trickle: true,
        stream,
        config: {
          iceServers: ICE_CONFIG.iceServers,
          // ✅ iceTransportPolicy: "relay" jaan-boojh kar nahi lagaya —
          // isse host/STUN candidates bhi try honge, TURN sirf fallback rahega
        },
      });
      peerRef.current = peer;
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
      peerRef.current?.signal(signalData);
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
    if (peerRef.current) {
      console.log("Call already in progress, ignoring duplicate acceptCall");
      return;
    }

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

    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: {
        iceServers: ICE_CONFIG.iceServers,
        // ✅ FIX — pehle yahan "iceTransportPolicy: 'relay'" tha, hata diya
        // taaki caller ki tarah receiver bhi host/STUN candidates try kar sake
      },
    });
    peerRef.current = peer;
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

    // callback ref se video mount ho chuka hoga is render ke baad,
    // par local stream turant bhi try kar lete hain
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

  // 👇 FIX — video/audio elements ko pehle pause + srcObject clear karo,
  // TAB jaake state "idle" karo. Isse elements unmount hote waqt koi
  // pending play() promise nahi bachta => AbortError console me nahi aayega.
  const cleanupCall = () => {
    [myVideoRef.current, remoteVideoRef.current, remoteAudioRef.current].forEach((el) => {
      if (!el) return;
      try {
        el.pause();
        el.srcObject = null;
      } catch (e) {
        // ignore
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
      {/* Video call me audio remote video element ke through hi aayega,
          isliye us case me ye element muted rehta hai (double audio na ho) */}
      <audio ref={setRemoteAudioEl} autoPlay hidden muted={callType === "video"} />

      {/* 👇 NAYA — autoplay block hone par ye overlay dikhega */}
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