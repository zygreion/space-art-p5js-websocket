let socket = null;
let onMessageCallback = null;

// Inisialisasi koneksi WebSocket
function initWebSocket(messageHandler) {
  onMessageCallback = messageHandler;
  connect();
}

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => console.log("Connected to Cloudflare WebSocket");

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessageCallback) {
        onMessageCallback(data);
      }
    } catch (err) {
      console.error("Gagal parse data WebSocket:", err);
    }
  };

  socket.onclose = () => {
    console.log("WebSocket terputus. Mencoba menghubungkan ulang...");
    setTimeout(connect, 1000);
  };
}

// Fungsi untuk mengirim data ke server
function sendWebSocketMessage(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  } else {
    console.warn("WebSocket belum siap. Pesan gagal dikirim.");
  }
}