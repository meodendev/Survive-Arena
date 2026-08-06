// ===== Survive Arena — Online Relay Server =====
// Server này KHÔNG chạy logic game, chỉ ghép cặp 2 người chơi vào 1 "phòng"
// bằng mã 5 ký tự rồi relay (chuyển tiếp) tin nhắn qua lại giữa 2 socket.
// Người tạo phòng = host, tự mô phỏng vật lý game và gửi state xuống.
// Người vào phòng = guest, chỉ gửi input lên và vẽ theo state nhận được.

const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map(); // code -> { host: ws|null, guest: ws|null }
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ ký tự dễ nhầm (0,O,1,I)

function genRoomCode() {
    let code;
    do {
        code = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
    } while (rooms.has(code));
    return code;
}

function send(ws, obj) {
    if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}

wss.on('connection', (ws) => {
    ws.room = null;
    ws.role = null;
    ws.isAlive = true;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }

        if (msg.t === 'create') {
            const code = genRoomCode();
            rooms.set(code, { host: ws, guest: null });
            ws.room = code;
            ws.role = 'host';
            send(ws, { t: 'created', code });
            return;
        }

        if (msg.t === 'join') {
            const code = (msg.code || '').toUpperCase().trim();
            const room = rooms.get(code);
            if (!room || !room.host || room.host.readyState !== room.host.OPEN) {
                send(ws, { t: 'error', msg: 'Mã phòng không tồn tại.' });
                return;
            }
            if (room.guest) {
                send(ws, { t: 'error', msg: 'Phòng đã đủ người.' });
                return;
            }
            room.guest = ws;
            ws.room = code;
            ws.role = 'guest';
            send(ws, { t: 'joined', code });
            send(room.host, { t: 'peer_joined' });
            return;
        }

        // Mọi message khác -> relay thẳng cho người còn lại trong phòng
        const room = rooms.get(ws.room);
        if (!room) return;
        const peer = ws.role === 'host' ? room.guest : room.host;
        if (peer) send(peer, msg);
    });

    ws.on('close', () => {
        if (!ws.room) return;
        const room = rooms.get(ws.room);
        if (!room) return;
        const peer = ws.role === 'host' ? room.guest : room.host;
        if (peer) send(peer, { t: 'peer_left' });
        if (ws.role === 'host') {
            rooms.delete(ws.room);
        } else {
            room.guest = null;
        }
    });
});

// Ping định kỳ để dọn socket chết + giữ kết nối trên các host free-tier
// (Render/Railway thường tự đóng socket "idle" nếu không có traffic)
const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 25000);

wss.on('close', () => clearInterval(pingInterval));

console.log(`Survive Arena relay server đang chạy trên cổng ${PORT}`);
