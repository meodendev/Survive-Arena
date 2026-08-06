// ===== Lớp kết nối Online (WebSocket relay, host-authoritative) =====
// Server chỉ làm nhiệm vụ relay tin nhắn giữa 2 socket trong cùng 1 phòng,
// KHÔNG chạy logic game. Người tạo phòng ("host") mô phỏng vật lý game
// bình thường (y hệt code local/bot sẵn có), người vào phòng ("guest")
// chỉ gửi input lên và vẽ lại theo state nhận được — không tự chạy vật lý,
// nhờ vậy tránh được lệch trạng thái (desync) giữa 2 máy.

let socket = null;
let handlers = {};

export function netConnect(url) {
    return new Promise((resolve, reject) => {
        try {
            socket = new WebSocket(url);
        } catch (err) {
            reject(err);
            return;
        }
        const onOpenOnce = () => {
            socket.removeEventListener('error', onErrorOnce);
            resolve();
        };
        const onErrorOnce = (e) => {
            socket.removeEventListener('open', onOpenOnce);
            reject(e);
        };
        socket.addEventListener('open', onOpenOnce, { once: true });
        socket.addEventListener('error', onErrorOnce, { once: true });

        socket.addEventListener('message', (ev) => {
            let msg;
            try {
                msg = JSON.parse(ev.data);
            } catch {
                return;
            }
            const fn = handlers[msg.t];
            if (fn) fn(msg);
        });

        socket.addEventListener('close', () => {
            const fn = handlers['disconnected'];
            if (fn) fn();
        });
    });
}

export function netOn(type, fn) {
    handlers[type] = fn;
}

export function netSend(obj) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(obj));
    }
}

export function netCreateRoom() {
    netSend({ t: 'create' });
}

export function netJoinRoom(code) {
    netSend({ t: 'join', code: (code || '').toUpperCase().trim() });
}

export function netIsConnected() {
    return !!socket && socket.readyState === WebSocket.OPEN;
}

export function netDisconnect() {
    if (socket) {
        try { socket.close(); } catch {}
    }
    socket = null;
    handlers = {};
}
