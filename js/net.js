// ===== Lớp kết nối Online (WebSocket relay, host-authoritative) =====
// Server chỉ làm nhiệm vụ relay tin nhắn giữa 2 socket trong cùng 1 phòng,
// KHÔNG chạy logic game. Người tạo phòng ("host") mô phỏng vật lý game
// bình thường (y hệt code local/bot sẵn có), người vào phòng ("guest")
// chỉ gửi input lên và vẽ lại theo state nhận được — không tự chạy vật lý,
// nhờ vậy tránh được lệch trạng thái (desync) giữa 2 máy.

export const NET_DEBUG = true; // đổi thành false để tắt log chẩn đoán

let socket = null;
let handlers = {};
let lastInputRecvLog = 0;
let lastStateRecvLog = 0;
let lastInputSendLog = 0;

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
            if (NET_DEBUG) console.log('[net] đã kết nối tới', url);
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
            if (NET_DEBUG) {
                const now = performance.now();
                if (msg.t === 'state') {
                    if (now - lastStateRecvLog > 1000) { lastStateRecvLog = now; console.log('[net] đang NHẬN state đều đặn (host->guest OK), p2 x=', msg.p2 && msg.p2.x); }
                } else if (msg.t === 'input') {
                    if (now - lastInputRecvLog > 1000) { lastInputRecvLog = now; console.log('[net] đang NHẬN input đều đặn (guest->host OK), dx=', msg.input && msg.input.dx, 'dy=', msg.input && msg.input.dy); }
                } else {
                    console.log('[net] nhận:', msg.t, msg);
                }
            }
            const fn = handlers[msg.t];
            if (fn) fn(msg);
        });

        socket.addEventListener('close', () => {
            if (NET_DEBUG) console.log('[net] socket đóng');
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
        if (NET_DEBUG) {
            const now = performance.now();
            if (obj.t === 'input') {
                if (now - lastInputSendLog > 1000) { lastInputSendLog = now; console.log('[net] đang GỬI input đều đặn, dx=', obj.input.dx, 'dy=', obj.input.dy); }
            } else {
                console.log('[net] gửi:', obj.t, obj);
            }
        }
        socket.send(JSON.stringify(obj));
    } else if (NET_DEBUG) {
        console.warn('[net] KHÔNG gửi được (socket chưa mở):', obj.t, 'readyState=', socket ? socket.readyState : 'null');
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
