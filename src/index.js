import { DurableObject } from "cloudflare:workers";

// -------------------------------------------------------------------
// 1. DURABLE OBJECT (Pengganti Socket.IO / Event Emitter)
// -------------------------------------------------------------------
export class WebSocketServer extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // Menyimpan daftar koneksi WebSocket aktif di dalam memori
    this.sessions = new Set();
  }

  async fetch(request) {
    // Membuat pasangan WebSocket (client <-> server)
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Menerima & mendaftarkan koneksi WebSocket di Cloudflare Runtime
    this.ctx.acceptWebSocket(server);
    this.sessions.add(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Menerima pesan "draw" dari 1 client, lalu broadcast ke client lain
  async webSocketMessage(ws, message) {
    for (const session of this.sessions) {
      // Sama seperti socket.broadcast.emit() di Socket.IO
      if (session !== ws) {
        try {
          session.send(message);
        } catch (err) {
          this.sessions.delete(session);
        }
      }
    }
  }

  // Bersihkan koneksi jika client terputus/close
  async webSocketClose(ws) {
    this.sessions.delete(ws);
  }

  // Bersihkan koneksi jika terjadi error
  async webSocketError(ws) {
    this.sessions.delete(ws);
  }
}

// -------------------------------------------------------------------
// 2. MAIN WORKER ROUTER (Pengganti Router Express)
// -------------------------------------------------------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handling Request Endpoint WebSocket (/ws)
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket handshake", { status: 426 });
      }

      // Ambil atau buat instance Durable Object tunggal untuk ruangan global
      const id = env.WEBSOCKET_SERVER.idFromName("global-room");
      const stub = env.WEBSOCKET_SERVER.get(id);

      // Teruskan request WebSocket ke Durable Object
      return stub.fetch(request);
    }

    // Jika bukan /ws, Cloudflare otomatis menyajikan file statis
    // dari folder /public (index.html, assets, p5.js, dll)
    return new Response("Not Found", { status: 404 });
  },
};