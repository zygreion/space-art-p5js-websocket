let socket = null;

function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => console.log("Connected to Cloudflare WebSocket");

  // Menerima data gambar (Khusus untuk halaman projection/draw)
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (typeof drawMsg === "function") {
      drawMsg(data);
    }
  };

  socket.onclose = () => setTimeout(connectWebSocket, 1000); // Auto reconnect jika terputus
}