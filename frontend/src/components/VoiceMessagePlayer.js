import React, { useRef, useState, useEffect } from "react";

const VoiceMessagePlayer = ({ src, isMine }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioDuration = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (secs) => {
    if (!isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`cv-voice-player ${isMine ? "mine" : "theirs"}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button type="button" className="cv-voice-play-btn" onClick={togglePlay}>
        <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
      </button>

      <div className="cv-voice-track" onClick={handleSeek}>
        <div className="cv-voice-track-fill" style={{ width: `${progress}%` }} />
        <div className="cv-voice-track-thumb" style={{ left: `${progress}%` }} />
      </div>

      <span className="cv-voice-time">
        {formatTime(currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
};

export default VoiceMessagePlayer;