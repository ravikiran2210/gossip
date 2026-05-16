import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    socket = io(SOCKET_URL, {
      auth: { token },
      // Force WebSocket — polling degrades to one HTTP request per ~25s and is
      // far slower. If WebSocket fails, Socket.IO will reconnect via WebSocket
      // rather than silently falling back to polling.
      transports: ['websocket'],
      autoConnect: false,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function connectSocket(token?: string) {
  const s = getSocket();
  if (token && s.auth) {
    (s.auth as any).token = token;
  }
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
  socket = null;
}
