const express = require("express");
const http = require("http"); // 1. Tambahkan modul http bawaan Node.js
const path = require("path");
const socket = require("socket.io");

const app = express();

// 2. Buat HTTP server dari Express app
const server = http.createServer(app);

// 3. Kaitkan Socket.IO ke HTTP server dengan konfigurasi CORS
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Menyajikan file statis dari folder public
app.use(express.static(path.join(__dirname, "public")));

// Socket.IO Connection Event
io.on("connection", newConnection);

function newConnection(socket) {
  console.log("New Connection:", socket.id);

  socket.on("draw", drawMsg);

  function drawMsg(data) {
    socket.broadcast.emit("draw", data);
    console.log("Received base64 dataURL:", data.type);
  }
}

// 4. Jalankan HTTP server (bukan app.listen)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});