import { Socket, Channel } from "phoenix";

export interface PresenceMeta {
  [key: string]: any;
}

export interface PresenceState<T = PresenceMeta> {
  [id: string]: {
    metas: T[];
  };
}

export type PresenceMap<T = PresenceMeta> = (T & { id: string })[];

export interface UsePresenceOptions<T = PresenceMeta> {
  socket?: Socket;
  channel?: Channel;
  socketUrl?: string;
  topic?: string;
  params?: Record<string, unknown>;
  onJoin?: (
    id: string,
    current: { metas: T[] } | undefined,
    newPres: { metas: T[] },
  ) => void;
  onLeave?: (
    id: string,
    current: { metas: T[] } | undefined,
    leftPres: { metas: T[] },
  ) => void;
}

export interface UsePresenceResult<T = PresenceMeta> {
  presence: PresenceMap<T>;
  state: PresenceState<T>;
  isJoined: boolean;
  error: Error | null;
}
