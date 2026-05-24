import { useState, useEffect, useRef, useMemo } from "react";
import { usePresence } from "../../src";
import { mockSocket } from "./mock-phoenix";

const NAMES = ["Alice", "Bob", "Carol", "Dan", "Eva", "Frank"];
const COLORS = [
  "#534AB7",
  "#0F6E56",
  "#993C1D",
  "#185FA5",
  "#854F0B",
  "#993556",
];

interface User {
  id: string;
  name: string;
  online_at: number;
}

const YOU: User = {
  id: "0",
  name: "You",
  online_at: Math.floor(Date.now() / 1000),
};

const POOL: User[] = NAMES.map((name, i) => ({
  id: String(i + 1),
  name,
  online_at: 0,
}));

const getAvatarStyle = (id: string) => {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = id === "0" ? "#2C2C2A" : COLORS[hash % COLORS.length];
  return {
    alignItems: "center",
    background: color,
    border: "2px solid #fff",
    borderRadius: "50%",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    color: "#fff",
    display: "flex",
    fontSize: 12,
    fontWeight: 500,
    height: 32,
    justifyContent: "center",
    width: 32,
  } as const;
};

export default function App() {
  const { presence, isJoined } = usePresence({
    socket: mockSocket,
    topic: "presence:lobby",
  });

  const [simulatedOthers, setSimulatedOthers] = useState<Record<string, User>>(
    {},
  );
  const [available, setAvailable] = useState<User[]>(POOL);
  const [log, setLog] = useState<
    { name: string; type: "join" | "leave"; ts: string }[]
  >([]);

  const presenceRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (name: string, type: "join" | "leave") =>
    setLog((prev) => [
      ...prev,
      {
        name,
        type,
        ts: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
    ]);

  // Sync mock "server" state whenever local simulation state changes
  useEffect(() => {
    if (!isJoined) return;
    const channel = mockSocket.getChannel("presence:lobby");
    if (!channel) return;

    const state = Object.fromEntries(
      Object.entries(simulatedOthers).map(([id, user]) => [
        id,
        { metas: [{ name: user.name, online_at: user.online_at }] },
      ]),
    );
    state[YOU.id] = { metas: [{ name: YOU.name, online_at: YOU.online_at }] };
    channel.trigger("presence_state", state);
  }, [isJoined, simulatedOthers]);

  // Handle auto-scroll
  useEffect(() => {
    [presenceRef, logRef].forEach((ref) => {
      if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    });
  }, [presence, log]);

  // Log "You" joining only once on connect
  useEffect(() => {
    if (isJoined) addLog(YOU.name, "join");
  }, [isJoined]);

  const join = () => {
    if (available.length === 0) return;
    const idx = Math.floor(Math.random() * available.length);
    const user = {
      ...available[idx],
      online_at: Math.floor(Date.now() / 1000),
    };

    setSimulatedOthers((prev) => ({ ...prev, [user.id]: user }));
    setAvailable((prev) => prev.filter((_, i) => i !== idx));
    addLog(user.name, "join");
  };

  const leave = () => {
    const activeIds = Object.keys(simulatedOthers);
    if (activeIds.length === 0) return;
    const id = activeIds[Math.floor(Math.random() * activeIds.length)];
    const user = simulatedOthers[id];

    setSimulatedOthers(({ [id]: _, ...rest }) => rest);
    setAvailable((prev) => [...prev, user]);
    addLog(user.name, "leave");
  };

  const reset = () => {
    setSimulatedOthers({});
    setAvailable(POOL);
    setLog([{
      name: YOU.name,
      type: "join",
      ts: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }]);
  };

  const simulatedCount = Object.keys(simulatedOthers).length;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 600,
        padding: 32,
      }}
    >
      <div
        style={{
          alignItems: "center",
          border: "1px solid #e5e5e5",
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 500 }}>Q3 Planning Doc</span>
          <span
            style={{
              background: isJoined ? "#e1f5ee" : "#faece7",
              borderRadius: 4,
              color: isJoined ? "#0f6e56" : "#993c1d",
              fontSize: 10,
              padding: "2px 6px",
            }}
          >
            {isJoined ? "CONNECTED" : "CONNECTING..."}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#888" }}>
            {presence.length} online
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              minHeight: 36,
            }}
          >
            {presence.map((u) => (
              <div key={u.id} style={getAvatarStyle(u.id)} title={u.name}>
                {u.name?.[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "1fr 1fr",
          marginBottom: 16,
        }}
      >
        <div
          ref={presenceRef}
          style={{
            background: "#f9f9f9",
            border: "1px solid #eee",
            borderRadius: 8,
            height: 240,
            overflowY: "scroll",
          }}
        >
          <div
            style={{
              background: "#f9f9f9",
              borderBottom: "1px solid #f0f0f0",
              padding: "12px 14px 6px",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <p style={{ fontSize: 11, color: "#999", margin: 0 }}>
              presence (from hook)
            </p>
          </div>
          <div style={{ padding: "12px 14px" }}>
            <pre
              style={{
                color: "#222",
                fontFamily: "monospace",
                fontSize: 11,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {presence.length === 0 ? "[]" : JSON.stringify(presence, null, 2)}
            </pre>
          </div>
        </div>
        <div
          ref={logRef}
          style={{
            background: "#f9f9f9",
            border: "1px solid #eee",
            borderRadius: 8,
            height: 240,
            overflowY: "scroll",
          }}
        >
          <div
            style={{
              background: "#f9f9f9",
              borderBottom: "1px solid #f0f0f0",
              padding: "12px 14px 6px",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <p style={{ fontSize: 11, color: "#999", margin: 0 }}>
              presence log
            </p>
          </div>
          <div style={{ padding: "6px 14px 12px" }}>
            {log.length === 0 ? (
              <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>
                no events yet
              </p>
            ) : (
              log.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "0.5px solid #eee",
                    fontSize: 12,
                    gap: 8,
                    padding: "3px 0",
                  }}
                >
                  <span
                    style={{
                      background: entry.type === "join" ? "#1D9E75" : "#D85A30",
                      borderRadius: "50%",
                      flexShrink: 0,
                      height: 6,
                      width: 6,
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>{entry.name}</span>
                  <span style={{ color: "#888" }}>
                    {entry.type === "join" ? "joined" : "left"}
                  </span>
                  <span style={{ color: "#bbb", marginLeft: "auto" }}>
                    {entry.ts}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={join}
          disabled={available.length === 0}
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 6,
            cursor: available.length === 0 ? "not-allowed" : "pointer",
            fontSize: 13,
            opacity: available.length === 0 ? 0.5 : 1,
            padding: "6px 14px",
          }}
        >
          + simulate join
        </button>
        <button
          onClick={leave}
          disabled={simulatedCount === 0}
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 6,
            cursor: simulatedCount === 0 ? "not-allowed" : "pointer",
            fontSize: 13,
            opacity: simulatedCount === 0 ? 0.5 : 1,
            padding: "6px 14px",
          }}
        >
          − simulate leave
        </button>
        <button
          onClick={reset}
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            marginLeft: "auto",
            padding: "6px 14px",
          }}
        >
          reset
        </button>
      </div>
    </div>
  );
}
