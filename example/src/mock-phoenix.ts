type Callback = (payload?: any) => void;

class MockPush {
  private callbacks: Record<string, Callback> = {};

  receive(status: string, callback: Callback) {
    this.callbacks[status] = callback;
    if (status === "ok") {
      setTimeout(() => callback({}), 10);
    }
    return this;
  }
}

class MockChannel {
  private eventListeners: Record<string, Callback[]> = {};
  public topic: string;
  // Presence expects these internal properties/methods
  public joinPush: MockPush;

  constructor(topic: string) {
    this.topic = topic;
    this.joinPush = new MockPush();
  }

  // Presence calls this internally
  joinRef() {
    return "mock-join-ref";
  }

  on(event: string, callback: Callback) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(callback);
    return this.eventListeners[event].length;
  }

  // Presence might call this to remove listeners
  off(event: string) {
    delete this.eventListeners[event];
  }

  join() {
    return this.joinPush;
  }

  leave() {
    return new MockPush();
  }

  trigger(event: string, payload: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((cb) => cb(payload));
    }
  }
}

class MockSocket {
  private channels: Record<string, MockChannel> = {};

  connect() {}
  disconnect() {}

  channel(topic: string) {
    if (!this.channels[topic]) {
      this.channels[topic] = new MockChannel(topic);
    }
    return this.channels[topic] as any;
  }

  getChannel(topic: string) {
    return this.channels[topic];
  }
}

export const mockSocket = new MockSocket() as any;
