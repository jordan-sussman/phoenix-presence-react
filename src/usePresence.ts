import { useEffect, useState, useRef, useMemo } from "react";
import { Socket, Channel, Presence } from "phoenix";
import type {
  PresenceMeta,
  PresenceState,
  UsePresenceOptions,
  UsePresenceResult,
} from "./types";

export const usePresence = <T = PresenceMeta>(
  options: UsePresenceOptions<T> = {},
): UsePresenceResult<T> => {
  const {
    socket: externalSocket,
    channel: externalChannel,
    socketUrl = "/socket",
    topic = "presence:lobby",
    params = {},
    onJoin,
    onLeave,
  } = options;

  const [state, setState] = useState<PresenceState<T>>({});
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const internalSocketRef = useRef<Socket | null>(null);
  const internalChannelRef = useRef<Channel | null>(null);
  const onJoinRef = useRef(onJoin);
  const onLeaveRef = useRef(onLeave);

  const paramsString = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    onJoinRef.current = onJoin;
    onLeaveRef.current = onLeave;
  }, [onJoin, onLeave]);

  useEffect(() => {
    let socket = externalSocket;
    let channel = externalChannel;

    if (!socket && !channel) {
      socket = new Socket(socketUrl, { params: JSON.parse(paramsString) });
      socket.connect();
      internalSocketRef.current = socket;
    }

    if (!channel) {
      if (!socket) return;
      channel = socket.channel(topic, JSON.parse(paramsString));
      internalChannelRef.current = channel;
    }

    const presence = new Presence(channel);

    presence.onJoin((id, current, newPres) => {
      if (onJoinRef.current) onJoinRef.current(id, current, newPres);
    });

    presence.onLeave((id, current, leftPres) => {
      if (onLeaveRef.current) onLeaveRef.current(id, current, leftPres);
    });

    presence.onSync(() => {
      setState({ ...presence.state });
    });

    channel
      .join()
      .receive("ok", () => {
        setIsJoined(true);
        setError(null);
      })
      .receive("error", (reasons) => {
        setError(new Error(reasons?.message || "Failed to join channel"));
      })
      .receive("timeout", () => {
        setError(new Error("Join timeout"));
      });

    return () => {
      if (internalChannelRef.current) {
        internalChannelRef.current.leave();
        internalChannelRef.current = null;
      }
      if (internalSocketRef.current) {
        internalSocketRef.current.disconnect();
        internalSocketRef.current = null;
      }
    };
  }, [externalSocket, externalChannel, socketUrl, topic, paramsString]);

  const presenceList = useMemo(() => {
    return Object.entries(state).map(([id, presence]) => ({
      ...presence.metas[0],
      id,
    }));
  }, [state]);

  return { presence: presenceList, state, isJoined, error };
};
