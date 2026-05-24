import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePresence } from "./usePresence";
import { Socket, Channel } from "phoenix";

vi.mock("phoenix", () => {
  const MockPush = {
    receive: vi.fn().mockReturnThis(),
  };

  const MockChannel = {
    on: vi.fn(),
    join: vi.fn().mockReturnValue(MockPush),
    leave: vi.fn(),
  };

  const MockSocket = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    channel: vi.fn().mockReturnValue(MockChannel),
  };

  return {
    Socket: vi.fn().mockImplementation(() => MockSocket),
    Channel: vi.fn().mockImplementation(() => MockChannel),
    Presence: vi.fn().mockImplementation((channel) => ({
      channel,
      onJoin: vi.fn(),
      onLeave: vi.fn(),
      onSync: vi.fn((cb) => {
        (MockChannel as any)._onSync = cb;
      }),
      state: {},
    })),
  };
});

describe("usePresence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes socket and channel when not provided", () => {
    renderHook(() => usePresence({ topic: "room:1" }));

    expect(Socket).toHaveBeenCalled();
    expect(Channel).not.toHaveBeenCalled(); // Channel is created via socket.channel
    const socketInstance = vi.mocked(Socket).mock.results[0].value;
    expect(socketInstance.channel).toHaveBeenCalledWith("room:1", {});
    expect(socketInstance.connect).toHaveBeenCalled();
  });

  it("uses provided socket", () => {
    const mockSocket = new Socket("/socket");
    renderHook(() =>
      usePresence({ socket: mockSocket as any, topic: "room:1" }),
    );

    expect(Socket).toHaveBeenCalledTimes(1); // Once for the manual creation
    expect(mockSocket.channel).toHaveBeenCalledWith("room:1", {});
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() => usePresence({ topic: "room:1" }));
    const socketInstance = vi.mocked(Socket).mock.results[0].value;
    const channelInstance = socketInstance.channel.mock.results[0].value;

    unmount();

    expect(channelInstance.leave).toHaveBeenCalled();
    expect(socketInstance.disconnect).toHaveBeenCalled();
  });
});
