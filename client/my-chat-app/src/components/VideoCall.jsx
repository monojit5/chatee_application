import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Video, X } from "lucide-react";
import { getAssetUrl } from "../api";

function getCameraError(error) {
  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
    return "Camera or microphone permission was denied. Allow access in your browser and try again.";
  }
  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return "No camera or microphone was found on this device.";
  }
  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return "The camera or microphone is already in use by another app.";
  }
  return "Could not access your camera or microphone. Check your device and browser permissions.";
}

function getCallStatus(phase, callType, peerName) {
  if (phase === "ready") return `${callType === "video" ? "Video" : "Audio"} call`;
  if (phase === "incoming") return `Incoming ${callType} call`;
  if (phase === "starting") return "Preparing your call…";
  if (phase === "ringing") return `Calling ${peerName}…`;
  if (phase === "connecting") return "Connecting…";
  if (phase === "connected") return `In ${callType} call`;
  return "Call ended";
}

export default function VideoCall({ chat, callType = "video", socket, incomingCall, onClose }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const mountedRef = useRef(true);
  const callIdRef = useRef(incomingCall?.callId || null);
  const pendingCandidatesRef = useRef([]);
  const [phase, setPhase] = useState(incomingCall ? "incoming" : "ready");
  const [callError, setCallError] = useState("");
  const [hasLocalMedia, setHasLocalMedia] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(callType === "video");

  const stopMedia = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    setHasLocalMedia(false);
    setHasRemoteVideo(false);
  }, []);

  const acquireMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera and microphone access requires HTTPS or localhost.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return null;
    }
    localStreamRef.current = stream;
    setHasLocalMedia(true);
    if (localVideoRef.current && callType === "video") {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, [callType]);

  const createPeerConnection = useCallback(() => {
    const connection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    localStreamRef.current?.getTracks().forEach((track) => {
      connection.addTrack(track, localStreamRef.current);
    });
    connection.onicecandidate = (event) => {
      if (event.candidate && callIdRef.current) {
        socket?.emit("call:ice-candidate", {
          callId: callIdRef.current,
          payload: event.candidate.toJSON(),
        });
      }
    };
    connection.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      setHasRemoteVideo(true);
    };
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") {
        setCallError("");
        setPhase("connected");
      } else if (connection.connectionState === "failed") {
        setCallError("Could not connect to the other person. Check your network and try again.");
        if (callIdRef.current) {
          socket?.emit("call:end", { callId: callIdRef.current });
        }
        setPhase("ended");
        stopMedia();
      }
    };
    peerConnectionRef.current = connection;
    return connection;
  }, [socket, stopMedia]);

  const acceptOffer = useCallback(async (description) => {
    let connection = peerConnectionRef.current;
    if (!connection) connection = createPeerConnection();
    await connection.setRemoteDescription(new RTCSessionDescription(description));
    for (const candidate of pendingCandidatesRef.current) {
      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidatesRef.current = [];
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    socket.emit("call:answer", {
      callId: callIdRef.current,
      payload: connection.localDescription.toJSON(),
    });
    setPhase("connecting");
  }, [createPeerConnection, socket]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopMedia();
    };
  }, [stopMedia]);

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && callType === "video") {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
    if (remoteAudioRef.current && remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callType, hasLocalMedia, hasRemoteVideo, phase]);

  useEffect(() => {
    if (!socket) return undefined;

    const onAccepted = async ({ callId }) => {
      if (callId !== callIdRef.current) return;
      try {
        const connection = peerConnectionRef.current || createPeerConnection();
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        if (!mountedRef.current) {
          socket.emit("call:end", { callId });
          return;
        }
        socket.emit("call:offer", {
          callId,
          payload: connection.localDescription.toJSON(),
        });
        setPhase("connecting");
      } catch (error) {
        console.error("Could not create the call offer:", error);
        setCallError("Could not connect this call. Please try again.");
        setPhase("ended");
        stopMedia();
        socket.emit("call:end", { callId });
      }
    };
    const onOffer = async ({ callId, payload }) => {
      if (callId !== callIdRef.current) return;
      try {
        await acceptOffer(payload);
      } catch (error) {
        console.error("Could not accept the incoming call offer:", error);
        setCallError("Could not connect this call. Please try again.");
        setPhase("ended");
        stopMedia();
        socket.emit("call:end", { callId });
      }
    };
    const onAnswer = async ({ callId, payload }) => {
      if (callId !== callIdRef.current) return;
      try {
        const connection = peerConnectionRef.current;
        if (!connection) throw new Error("The call connection is unavailable.");
        await connection.setRemoteDescription(new RTCSessionDescription(payload));
        for (const candidate of pendingCandidatesRef.current) {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      } catch (error) {
        console.error("Could not apply the call answer:", error);
        setCallError("Could not connect this call. Please try again.");
        setPhase("ended");
        stopMedia();
        socket.emit("call:end", { callId });
      }
    };
    const onIceCandidate = async ({ callId, payload }) => {
      if (callId !== callIdRef.current) return;
      const connection = peerConnectionRef.current;
      if (!connection?.remoteDescription) {
        pendingCandidatesRef.current.push(payload);
        return;
      }
      try {
        await connection.addIceCandidate(new RTCIceCandidate(payload));
      } catch (error) {
        console.error("Could not add a call network candidate:", error);
      }
    };
    const onEnded = ({ callId, reason }) => {
      if (callId !== callIdRef.current) return;
      setCallError(reason === "declined"
        ? `${chat.name} declined the call.`
        : reason === "timeout"
          ? "The call was not answered."
          : reason === "disconnected"
            ? "The other person disconnected."
            : "");
      setPhase("ended");
      stopMedia();
    };

    socket.on("call:accepted", onAccepted);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:ended", onEnded);
    return () => {
      socket.off("call:accepted", onAccepted);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:ended", onEnded);
      stopMedia();
    };
  }, [acceptOffer, chat.name, createPeerConnection, socket, stopMedia]);

  const startCall = async () => {
    if (!socket?.connected) {
      setCallError("Chat connection is unavailable. Refresh and try again.");
      return;
    }
    setPhase("starting");
    setCallError("");
    try {
      await acquireMedia();
      if (!mountedRef.current || !localStreamRef.current) return;
      const response = await socket.timeout(10000).emitWithAck("call:start", {
        conversationId: chat._id,
        callType,
      });
      if (!response.ok) throw new Error(response.message);
      callIdRef.current = response.callId;
      if (!mountedRef.current) {
        socket.emit("call:end", { callId: response.callId });
        return;
      }
      createPeerConnection();
      setPhase("ringing");
    } catch (error) {
      console.error("Could not start the call:", error);
      if (callIdRef.current) socket.emit("call:end", { callId: callIdRef.current });
      callIdRef.current = null;
      stopMedia();
      setCallError(getVisibleError(error));
      setPhase("ended");
    }
  };

  const acceptCall = async () => {
    if (!socket?.connected || !incomingCall) {
      setCallError("Chat connection is unavailable. Refresh and try again.");
      return;
    }
    setPhase("starting");
    setCallError("");
    try {
      await acquireMedia();
      if (!mountedRef.current || !localStreamRef.current) return;
      createPeerConnection();
      const response = await socket.timeout(10000).emitWithAck("call:accept", {
        callId: incomingCall.callId,
      });
      if (!response.ok) throw new Error(response.message);
      setPhase("connecting");
    } catch (error) {
      console.error("Could not answer the call:", error);
      stopMedia();
      setCallError(getVisibleError(error));
      setPhase("ended");
      socket.emit("call:end", { callId: incomingCall.callId });
    }
  };

  const closeCall = () => {
    if (callIdRef.current && phase !== "ended") {
      socket?.emit(incomingCall && phase === "incoming" ? "call:reject" : "call:end", {
        callId: callIdRef.current,
      });
    }
    stopMedia();
    onClose();
  };

  const toggleMicrophone = () => {
    const nextEnabled = !microphoneEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setMicrophoneEnabled(nextEnabled);
  };

  const toggleCamera = () => {
    const nextEnabled = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setCameraEnabled(nextEnabled);
  };

  const getVisibleError = (error) => {
    if (["NotAllowedError", "PermissionDeniedError", "NotFoundError", "DevicesNotFoundError", "NotReadableError", "TrackStartError"].includes(error?.name)) {
      return getCameraError(error);
    }
    return error?.message || "Could not complete the call. Please try again.";
  };

  const isConnected = phase === "connected";
  const isIncoming = phase === "incoming";
  const showLocalPreview = callType === "video" && hasLocalMedia;
  const statusText = getCallStatus(phase, callType, chat.name);

  return (
    <div className="call-overlay" role="dialog" aria-modal="true" aria-labelledby="call-title">
      <section className="call-dialog">
        <header className="call-header">
          <div id="call-title" className="call-status">
            <span className="call-status-dot" />
            {statusText}
          </div>
          <button type="button" className="icon-button" aria-label="Close call" onClick={closeCall}>
            <X size={19} />
          </button>
        </header>

        <div className="call-stage">
          {isConnected && callType === "video" && hasRemoteVideo ? (
            <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline />
          ) : showLocalPreview ? (
            <video ref={localVideoRef} className={isConnected ? "call-self-video" : "local-video"} autoPlay playsInline muted />
          ) : (
            <div className="call-placeholder">
              <span className="call-avatar">
                {chat.type === "group"
                  ? <span className="call-group-icon"><Video size={28} /></span>
                  : <img src={getAssetUrl(chat.avatar) || "https://i.pravatar.cc/100?img=12"} alt="" />}
              </span>
              <h2>{incomingCall?.callerName || chat.name}</h2>
              <p>{callError || (isIncoming ? `Incoming ${callType} call` : isConnected ? "Audio is connected" : statusText)}</p>
            </div>
          )}
          {showLocalPreview && isConnected && (
            <video ref={localVideoRef} className="call-self-video" autoPlay playsInline muted />
          )}
          {callType === "audio" && (
            <audio ref={remoteAudioRef} autoPlay />
          )}
          {callError && <p className="call-permission-note">{callError}</p>}
        </div>

        <footer className="call-controls">
          {!incomingCall && phase === "ready" && (
            <button type="button" className="call-join-button" onClick={startCall}>
              {callType === "video" ? <Video size={18} /> : <Mic size={18} />}
              Start {callType} call
            </button>
          )}
          {isIncoming && (
            <>
              <button type="button" className="call-join-button" onClick={acceptCall}>Answer</button>
              <button type="button" className="call-control call-end" aria-label="Decline call" onClick={closeCall}>
                <PhoneOff size={20} />
              </button>
            </>
          )}
          {hasLocalMedia && (
            <>
              <button
                type="button"
                className={`call-control ${microphoneEnabled ? "" : "is-muted"}`}
                onClick={toggleMicrophone}
                aria-label={microphoneEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {microphoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              {callType === "video" && (
                <button
                  type="button"
                  className={`call-control ${cameraEnabled ? "" : "is-muted"}`}
                  onClick={toggleCamera}
                  aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                >
                  {cameraEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
                </button>
              )}
            </>
          )}
          {phase !== "ready" && !isIncoming && (
            <button type="button" className="call-control call-end" aria-label="End call" onClick={closeCall}>
              <PhoneOff size={20} />
            </button>
          )}
        </footer>
        <p className="call-disclaimer">
          Direct calls use peer-to-peer WebRTC. Both people must be online and allow device access.
        </p>
      </section>
    </div>
  );
}
