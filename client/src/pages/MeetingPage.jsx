import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Mic,
  MicOff,
  MonitorUp,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";

import { selectAuth } from "../features/auth/authSlice";
import { getSocket } from "../services/socket";
import { api, unwrap } from "../services/api";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

const CALL_STATES = {
  IDLE: "idle",
  RINGING: "ringing",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ENDED: "ended",
};

export default function MeetingPage() {
  const { meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const queryTarget = searchParams.get("target");
  const queryName = searchParams.get("name") || "Participant";
  const queryRole = searchParams.get("role");

  const navigate = useNavigate();
  const { user, accessToken } = useSelector(selectAuth);

  // Resolved meeting info (from query params or API)
  const [targetUserId, setTargetUserId] = useState(queryTarget || null);
  const [remoteName, setRemoteName] = useState(queryName);
  const [isCaller, setIsCaller] = useState(queryRole === "caller");
  const [resolving, setResolving] = useState(!queryTarget);

  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);

  // ── Resolve meeting by ID if no target in query ────
  useEffect(() => {
    if (queryTarget) {
      setResolving(false);
      return;
    }

    if (!meetingId || !accessToken || !user) return;

    api.get(`/sessions/meeting/${meetingId}`)
      .then((res) => {
        const session = unwrap(res);
        if (session) {
          const senderId = session.matchRequest?.senderId;
          const receiverId = session.matchRequest?.receiverId;
          const senderName = session.matchRequest?.sender?.name || "Participant";
          const receiverName = session.matchRequest?.receiver?.name || "Participant";

          const otherId = senderId === user.id ? receiverId : senderId;
          const otherName = senderId === user.id ? receiverName : senderName;

          setTargetUserId(otherId);
          setRemoteName(otherName);
          setIsCaller(true);
        }
      })
      .catch((err) => {
        console.error("Failed to resolve meeting:", err);
        navigate(-1);
      })
      .finally(() => setResolving(false));
  }, [meetingId, queryTarget, accessToken, user, navigate]);

  // ── Format elapsed time ─────────────────────────────
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Cleanup ─────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    iceCandidateQueueRef.current = [];
  }, []);

  // ── Start elapsed timer ─────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  // ── Get local media ─────────────────────────────────
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        localStreamRef.current = stream;
        setCamOn(false);
        return stream;
      } catch (audioError) {
        console.error("Cannot access media devices:", audioError);
        return null;
      }
    }
  }, []);

  // ── Process queued ICE candidates ───────────────────
  const processIceCandidateQueue = useCallback(() => {
    const pc = peerRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    }
  }, []);

  // ── Create peer connection ──────────────────────────
  const createPeerConnection = useCallback(
    (socket) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          let stream = remoteVideoRef.current.srcObject;
          if (!stream) {
            stream = new MediaStream();
            remoteVideoRef.current.srcObject = stream;
          }
          stream.addTrack(event.track);
          remoteVideoRef.current.play().catch((err) => console.error("Playback error:", err));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("call:ice-candidate", {
            targetUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCallState(CALL_STATES.CONNECTED);
          startTimer();
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setCallState(CALL_STATES.ENDED);
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setCallState(CALL_STATES.CONNECTED);
          startTimer();
        }
      };

      return pc;
    },
    [targetUserId, startTimer]
  );

  // ── Main effect: initialize and handle signaling ────
  useEffect(() => {
    if (!accessToken || !targetUserId || resolving) return;

    const socket = getSocket(accessToken);
    if (!socket) return;
    socketRef.current = socket;

    let mounted = true;

    const init = async () => {
      await getLocalStream();

      if (isCaller) {
        setCallState(CALL_STATES.RINGING);
        socket.emit("call:initiate", {
          targetUserId,
          callerName: user?.name || "Someone",
          sessionId: meetingId,
        });
      } else {
        socket.emit("call:accept", { callerId: targetUserId });
      }
    };

    const onCallAccepted = async () => {
      if (!mounted) return;
      setCallState(CALL_STATES.CONNECTING);

      const pc = createPeerConnection(socket);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:offer", { targetUserId, offer });
      } catch (error) {
        console.error("Failed to create offer:", error);
      }
    };

    const onCallRejected = () => {
      if (!mounted) return;
      setCallState(CALL_STATES.ENDED);
    };

    const onCallOffer = async ({ offer }) => {
      if (!mounted) return;
      setCallState(CALL_STATES.CONNECTING);

      const pc = createPeerConnection(socket);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        processIceCandidateQueue();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:answer", { targetUserId, answer });
      } catch (error) {
        console.error("Failed to handle offer:", error);
      }
    };

    const onCallAnswer = async ({ answer }) => {
      if (!mounted) return;
      const pc = peerRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        processIceCandidateQueue();
      } catch (error) {
        console.error("Failed to set remote description:", error);
      }
    };

    const onIceCandidate = ({ candidate }) => {
      if (!mounted) return;
      const pc = peerRef.current;

      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      } else {
        iceCandidateQueueRef.current.push(candidate);
      }
    };

    const onCallEnded = () => {
      if (!mounted) return;
      setCallState(CALL_STATES.ENDED);
    };

    socket.on("call:accepted", onCallAccepted);
    socket.on("call:rejected", onCallRejected);
    socket.on("call:offer", onCallOffer);
    socket.on("call:answer", onCallAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:ended", onCallEnded);

    init();

    return () => {
      mounted = false;
      socket.off("call:accepted", onCallAccepted);
      socket.off("call:rejected", onCallRejected);
      socket.off("call:offer", onCallOffer);
      socket.off("call:answer", onCallAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:ended", onCallEnded);
      cleanup();
    };
  }, [
    accessToken,
    targetUserId,
    meetingId,
    isCaller,
    resolving,
    user?.name,
    getLocalStream,
    createPeerConnection,
    processIceCandidateQueue,
    cleanup,
  ]);

  // ── Toggle mic ──────────────────────────────────────
  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicOn((prev) => !prev);
  };

  // ── Toggle camera ──────────────────────────────────
  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCamOn((prev) => !prev);
  };

  // ── Screen share ────────────────────────────────────
  const toggleScreenShare = async () => {
    const pc = peerRef.current;
    if (!pc) return;

    if (sharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.track === null);
        if (sender) sender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screen;
        const screenTrack = screen.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video" || s.track === null);
        if (sender) sender.replaceTrack(screenTrack);
        
        // Show screen share locally
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screen;
        }

        screenTrack.onended = () => {
          const vt = localStreamRef.current?.getVideoTracks()[0];
          if (vt && sender) sender.replaceTrack(vt);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          screenStreamRef.current = null;
          setSharing(false);
        };
        setSharing(true);
      } catch (error) {
        console.error("Screen share failed:", error);
      }
    }
  };

  // ── End call ────────────────────────────────────────
  const endCall = () => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit("call:end", { targetUserId });
    }
    cleanup();
    setCallState(CALL_STATES.ENDED);
  };

  // ── Leave (navigate back) ──────────────────────────
  const leave = () => {
    cleanup();
    navigate(-1);
  };

  // ── Resolving state ─────────────────────────────────
  if (resolving) {
    return (
      <div className="meeting-page">
        <div className="meeting-overlay">
          <div className="meeting-avatar">
            <Video size={36} />
          </div>
          <p className="meeting-status-text">Joining meeting...</p>
        </div>
      </div>
    );
  }

  // ── Status text ─────────────────────────────────────
  const statusText = {
    [CALL_STATES.IDLE]: "Initializing...",
    [CALL_STATES.RINGING]: `Calling ${remoteName}...`,
    [CALL_STATES.CONNECTING]: "Connecting...",
    [CALL_STATES.CONNECTED]: formatTime(elapsed),
    [CALL_STATES.ENDED]: "Call ended",
  };

  return (
    <div className="meeting-page">
      {/* Remote video (full screen) */}
      <div className="meeting-remote">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="meeting-remote-video"
        />
        {callState !== CALL_STATES.CONNECTED && (
          <div className="meeting-overlay">
            <div className="meeting-avatar">
              {remoteName.charAt(0).toUpperCase()}
            </div>
            <p className="meeting-status-text">{statusText[callState]}</p>
            {callState === CALL_STATES.RINGING && (
              <div className="meeting-pulse-ring" />
            )}
          </div>
        )}
      </div>

      {/* Local video (PiP) */}
      <div className="meeting-local">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="meeting-local-video"
        />
        {!camOn && (
          <div className="meeting-local-novideos">
            <VideoOff size={20} />
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="meeting-topbar">
        <button className="meeting-back-btn" onClick={leave} title="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="meeting-topbar-info">
          <p className="meeting-topbar-name">{remoteName}</p>
          <p className="meeting-topbar-status">
            {callState === CALL_STATES.CONNECTED
              ? formatTime(elapsed)
              : statusText[callState]}
          </p>
        </div>
      </div>

      {/* Controls bar */}
      <div className="meeting-controls">
        <div className="meeting-controls-inner">
          <button
            className={`meeting-ctrl-btn ${!micOn ? "meeting-ctrl-off" : ""}`}
            onClick={toggleMic}
            title={micOn ? "Mute" : "Unmute"}
          >
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>

          <button
            className={`meeting-ctrl-btn ${!camOn ? "meeting-ctrl-off" : ""}`}
            onClick={toggleCamera}
            title={camOn ? "Turn off camera" : "Turn on camera"}
          >
            {camOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>

          <button
            className={`meeting-ctrl-btn ${sharing ? "meeting-ctrl-active" : ""}`}
            onClick={toggleScreenShare}
            title={sharing ? "Stop sharing" : "Share screen"}
            disabled={callState !== CALL_STATES.CONNECTED}
          >
            <MonitorUp size={22} />
          </button>

          {callState === CALL_STATES.ENDED ? (
            <button className="meeting-ctrl-btn meeting-ctrl-leave" onClick={leave} title="Leave">
              <Phone size={22} />
            </button>
          ) : (
            <button className="meeting-ctrl-btn meeting-ctrl-end" onClick={endCall} title="End call">
              <PhoneOff size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
