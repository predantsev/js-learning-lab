// Lab helper (read-only). serve(server): starts an http.Server on a free 127.0.0.1 port → { base, close() }.
export async function serve(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
