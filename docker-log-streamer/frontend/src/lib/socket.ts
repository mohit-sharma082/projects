import { io, Socket } from 'socket.io-client';

const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:5010';

class SocketManager {
    socket: Socket | null = null;
    ensure() {
        if (!this.socket) {
            this.socket = io(BASE, { transports: ['websocket'] });
        }
        return this.socket;
    }
    subscribe(id: string, handler: (msg: any) => void) {
        const s = this.ensure();
        s.on('connect', () => s.emit('subscribe', { id }));
        const cb = (payload: any) => {
            if (payload?.id === id) handler(payload);
        };
        s.on('log', cb);
        return () => {
            s.emit('unsubscribe', { id });
            s.off('log', cb);
        };
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
export const socketManager = new SocketManager();
