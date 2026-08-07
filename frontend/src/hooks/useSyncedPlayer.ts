"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RoomStateValue = "waiting" | "playing" | "paused" | "ended";

export interface RemoteRoomState {
  state: RoomStateValue;
  position: number;   // seconds — the position as-of server_time
  speed: number;
  hostId: string;
  memberCount: number;
  serverTime: number; // unix timestamp from server (seconds, float)
}

export interface ChatMessageData {
  id: string;
  user: { id: string; username: string };
  content: string;
  message_type: "text" | "emoji_reaction" | "timestamp_share";
  timestamp_reference?: number;
  created_at: string;
}

export interface RoomMember {
  id: string;
  username: string;
}

interface UseSyncedPlayerOptions {
  roomId: string;
  wsToken: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isHost: boolean;
  /** Called whenever the remote state changes, so the UI can update. */
  onStateChange?: (state: RemoteRoomState) => void;
  /** Called when a new chat message arrives. */
  onChatMessage?: (msg: ChatMessageData) => void;
  /** Called when room membership changes. */
  onMemberUpdate?: (count: number, userIds: string[], members: RoomMember[]) => void;
  /** Called when the room is deleted by the host. */
  onRoomDeleted?: () => void;
}

function getWsBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return apiUrl.replace(/^http/, "ws");
}

// ── Tuning constants ──────────────────────────────────────────────────────────
// Only hard-seek when we're genuinely far off — large enough to not cause
// a feedback loop with HLS segment loading, small enough to fix real drift.
const HARD_SEEK_THRESHOLD = 3.0;   // seconds — increased to avoid buffering loop
const SOFT_CORRECT_THRESHOLD = 0.5; // seconds — wider dead-zone for gentle nudge
const PAUSE_SYNC_THRESHOLD = 0.35;  // seconds
const RATE_NUDGE = 0.04;            // 4% speed nudge (inaudible on most content)
const DRIFT_CHECK_INTERVAL = 2500;  // ms between drift corrections

export function useSyncedPlayer({
  roomId,
  wsToken,
  videoRef,
  isHost,
  onStateChange,
  onChatMessage,
  onMemberUpdate,
  onRoomDeleted,
}: UseSyncedPlayerOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const latestState = useRef<RemoteRoomState | null>(null);
  // Wall-clock time (ms) when the latest ROOM_STATE was received by this client.
  // Used with server_time to compute clock offset for latency compensation.
  const stateReceivedWallMs = useRef<number>(0);
  // The estimated one-way latency from server to client (ms)
  const estimatedLatencyMs = useRef<number>(100); 
  // Wall-clock time (ms) when the user last initiated a PLAY/PAUSE/SEEK command
  const lastCommandSentAt = useRef<number>(0);

  const pingInterval = useRef<ReturnType<typeof setInterval>>();
  const driftInterval = useRef<ReturnType<typeof setInterval>>();

  const [isConnected, setIsConnected] = useState(false);
  const [remoteState, setRemoteState] = useState<RemoteRoomState | null>(null);

  const isHostRef = useRef(isHost);
  const onStateChangeRef = useRef(onStateChange);
  const onChatMessageRef = useRef(onChatMessage);
  const onMemberUpdateRef = useRef(onMemberUpdate);
  const onRoomDeletedRef = useRef(onRoomDeleted);
  const videoRefRef = useRef(videoRef);

  isHostRef.current = isHost;
  onStateChangeRef.current = onStateChange;
  onChatMessageRef.current = onChatMessage;
  onMemberUpdateRef.current = onMemberUpdate;
  onRoomDeletedRef.current = onRoomDeleted;
  videoRefRef.current = videoRef;

  // ── Apply remote state to the local video element ─────────────────────────
  //
  // Position compensation strategy:
  //   The server sends `position` = where the video was at `server_time`.
  //   We estimate one-way latency from (local wall clock - server_time).
  //   expectedPosition = state.position + (estimatedLatency + timeSinceReceived) * speed
  //
  // This means even if the ROOM_STATE message took 200ms to arrive, we still
  // land the guest video at the right position.
  //
  const applyRemoteStateRef = useRef((state: RemoteRoomState) => {
    const video = videoRefRef.current.current;
    if (!video) return;

    // Only seek if HLS has loaded metadata and has seekable ranges
    // readyState: 0=HAVE_NOTHING 1=HAVE_METADATA 2=HAVE_CURRENT_DATA 3=HAVE_FUTURE_DATA 4=HAVE_ENOUGH_DATA
    const canSeek = video.readyState >= 1 && video.seekable.length > 0;

    // Don't perform hard seeks while the video is actively buffering — it
    // disrupts HLS segment loading and creates a seek→buffer→drift feedback loop.
    const isBuffering = video.readyState < 3 && !video.paused;

    if (state.state === "paused" || state.state === "waiting" || state.state === "ended") {
      if (!video.paused) {
        video.pause();
      }
      // Sync position on pause — only if massively out of sync!
      // Setting currentTime while paused flushes the HLS buffer, causing a 
      // 2-3 second delay when Play is pressed later. If it's just a small drift,
      // let the soft-correction handle it smoothly after Play is pressed.
      if (canSeek && Math.abs(video.currentTime - state.position) > PAUSE_SYNC_THRESHOLD) {
        video.currentTime = state.position;
      }
      video.playbackRate = 1.0;
      return;
    }

    if (state.state === "playing") {
      // Compute how far ahead the video *should* be from the server's reported position:
      //   1. estimatedLatencyMs: time it took for the message to travel server→client
      //   2. timeSinceReceivedMs: additional time elapsed since we received it
      const nowMs = Date.now();
      const timeSinceReceivedMs = nowMs - stateReceivedWallMs.current;
      const totalElapsedSeconds = (estimatedLatencyMs.current + timeSinceReceivedMs) / 1000;
      const expectedPosition = state.position + Math.max(0, totalElapsedSeconds) * state.speed;
      const drift = video.currentTime - expectedPosition;

      if (!isBuffering && canSeek && Math.abs(drift) > HARD_SEEK_THRESHOLD) {
        // Only hard-seek when genuinely far off AND not buffering
        video.currentTime = expectedPosition;
        video.playbackRate = state.speed;
      } else if (!isBuffering && Math.abs(drift) > SOFT_CORRECT_THRESHOLD) {
        // Gentle speed nudge to converge without noticeable pitch change
        video.playbackRate = drift > 0
          ? Math.max(0.85, state.speed - RATE_NUDGE)
          : Math.min(1.15, state.speed + RATE_NUDGE);
      } else {
        // In sync — restore normal speed
        video.playbackRate = state.speed;
      }

      if (video.paused) {
        video.play().catch(() => { /* autoplay blocked — user must interact */ });
      }
    }
  });

  // ── WebSocket connection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!wsToken || !roomId) return;

    const url = `${getWsBase()}/api/rooms/${roomId}/ws?token=${wsToken}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);

      // Keep-alive ping every 20 seconds
      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 20_000);

      // Periodic drift correction for guests only.
      // Runs every DRIFT_CHECK_INTERVAL ms and re-applies the last known
      // server state — accounting for time elapsed since we received it.
      driftInterval.current = setInterval(() => {
        if (!isHostRef.current && latestState.current) {
          // If the user recently sent a command (e.g. paused the video), 
          // suppress drift correction for 2 seconds to avoid fighting the 
          // optimistic local state while waiting for the server to echo it back.
          if (Date.now() - lastCommandSentAt.current > 2000) {
            applyRemoteStateRef.current(latestState.current);
          }
        }
      }, DRIFT_CHECK_INTERVAL);
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingInterval.current) clearInterval(pingInterval.current);
      if (driftInterval.current) clearInterval(driftInterval.current);
    };

    ws.onerror = () => {};

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      if (msg.type === "ROOM_STATE") {
        const state: RemoteRoomState = {
          state: msg.state as RoomStateValue,
          position: msg.position as number,
          speed: msg.speed as number,
          hostId: msg.host_id as string,
          memberCount: msg.member_count as number,
          serverTime: msg.server_time as number,
        };

        // Record when we received this state (wall clock, not performance.now())
        const nowMs = Date.now();
        stateReceivedWallMs.current = nowMs;

        // Estimate one-way latency: (local_now - server_time_ms).
        // The server sends server_time as a Unix timestamp (float seconds).
        // This estimate is asymmetric (only one-way) but good enough — on a
        // LAN it's <5ms, on WAN typically 10-150ms.
        const serverTimeMs = state.serverTime * 1000;
        const rawLatency = nowMs - serverTimeMs;
        if (rawLatency >= 0 && rawLatency < 5000) {
          // Smooth the estimate with exponential moving average (α=0.3)
          estimatedLatencyMs.current = 0.7 * estimatedLatencyMs.current + 0.3 * rawLatency;
        }

        latestState.current = state;
        setRemoteState(state);
        onStateChangeRef.current?.(state);

        // EVERYONE (including host) follows remote state on message receipt.
        // If we just sent a command, our local state is already optimistic,
        // and applyRemoteState is idempotent (only hard-seeks if drift > threshold).
        // This ensures the host's video plays/pauses if a guest triggers it in an unlocked room.
        applyRemoteStateRef.current(state);
      } else if (msg.type === "CHAT_MESSAGE") {
        onChatMessageRef.current?.(msg as unknown as ChatMessageData);
      } else if (msg.type === "MEMBER_UPDATE") {
        const userIds = msg.user_ids as string[];
        // Backend sends `members` with usernames since the latest update;
        // fall back to building anonymous member list from user_ids for backward compat.
        const members: RoomMember[] = (msg.members as RoomMember[] | undefined) ??
          userIds.map((id) => ({ id, username: "" }));
        onMemberUpdateRef.current?.(msg.count as number, userIds, members);
      } else if (msg.type === "ROOM_DELETED") {
        // Room was deleted by host — notify the UI so it can redirect
        onRoomDeletedRef.current?.();
      }
    };

    return () => {
      // Null out handlers first so no state updates fire after unmount
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      // Only close if not already closing/closed to avoid the
      // "WebSocket is closed before the connection is established" browser error
      if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounted");
      }
      wsRef.current = null;
      setIsConnected(false);
      if (pingInterval.current) clearInterval(pingInterval.current);
      if (driftInterval.current) clearInterval(driftInterval.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsToken, roomId]);

  // ── Sync control functions ─────────────────────────────────────────────────
  const sendCommand = useCallback((type: string, position?: number, extra?: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    const msg: Record<string, unknown> = { type };
    if (position !== undefined) msg.position = position;
    if (extra) Object.assign(msg, extra);
    ws.send(JSON.stringify(msg));

    // Optimistically record the command time to suppress drift correction temporarily
    if (type === "PLAY" || type === "PAUSE" || type === "SEEK" || type === "ENDED" || type === "SPEED") {
      lastCommandSentAt.current = Date.now();
    }
  }, []);

  const play = useCallback((position: number) => sendCommand("PLAY", position), [sendCommand]);
  const pause = useCallback((position: number) => sendCommand("PAUSE", position), [sendCommand]);
  const seek = useCallback((position: number) => sendCommand("SEEK", position), [sendCommand]);
  const ended = useCallback((position: number) => sendCommand("ENDED", position), [sendCommand]);
  const setSpeed = useCallback((speed: number, position: number) => {
    sendCommand("SPEED", position, { speed });
  }, [sendCommand]);

  const sendChatMessage = useCallback((
    content: string,
    type: "text" | "emoji_reaction" | "timestamp_share" = "text",
    timestampRef?: number,
  ) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const msg: Record<string, unknown> = {
      type: "CHAT_MESSAGE",
      content,
      message_type: type,
    };
    if (timestampRef !== undefined) {
      msg.timestamp_reference = timestampRef;
    }
    ws.send(JSON.stringify(msg));
  }, []);

  return {
    isConnected,
    remoteState,
    play,
    pause,
    seek,
    ended,
    setSpeed,
    sendChatMessage,
  };
}
