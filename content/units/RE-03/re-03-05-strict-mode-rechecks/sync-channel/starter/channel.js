// A fake sync channel: an external system that keeps one connection per call to connect().
const open = new Set();

export function connect(listId) {
  const connection = { listId };
  open.add(connection);
  console.log(`connect ${listId}`);
  return {
    disconnect() {
      if (!open.has(connection)) return;
      open.delete(connection);
      console.log(`disconnect ${listId}`);
    },
  };
}

export function liveConnections() {
  return [...open].map((connection) => connection.listId);
}
