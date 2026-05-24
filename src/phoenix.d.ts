declare module "phoenix" {
  export class Socket {
    constructor(endPoint: string, opts?: { params?: Record<string, unknown> });
    connect(): void;
    disconnect(): void;
    channel(topic: string, params?: Record<string, unknown>): Channel;
  }

  export class Channel {
    on(event: string, callback: (payload: any) => void): number;
    join(): Push;
    leave(): Push;
  }

  export class Push {
    receive(status: string, callback: (response?: any) => void): Push;
  }

  export class Presence {
    constructor(
      channel: Channel,
      opts?: { events?: { state: string; diff: string } },
    );
    state: any;
    onJoin(
      callback: (id: string, currentPresence: any, newPresence: any) => void,
    ): void;
    onLeave(
      callback: (id: string, currentPresence: any, leftPresence: any) => void,
    ): void;
    onSync(callback: () => void): void;
    list<T = any>(callback: (id: string, presence: { metas: any[] }) => T): T[];
    static syncState(
      state: any,
      newState: any,
      onJoin?: any,
      onLeave?: any,
    ): any;
    static syncDiff(state: any, diff: any, onJoin?: any, onLeave?: any): any;
    static list<T = any>(
      state: any,
      callback: (id: string, presence: { metas: any[] }) => T,
    ): T[];
  }
}
