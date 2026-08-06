# Survive Arena — Online Relay Server

Server nhỏ dùng WebSocket để ghép cặp 2 người chơi và relay tin nhắn qua lại.
**Không chạy logic game** — máy của người tạo phòng ("host") tự mô phỏng
vật lý (y hệt code chế độ Local/Bot sẵn có), server chỉ chuyển tiếp gói tin.

## Vì sao cần server riêng?

`Survive-Arena-main` là static site (HTML/CSS/JS thuần), host được trên
GitHub Pages — nhưng GitHub Pages **không chạy được code server** (không có
WebSocket, không có Node.js). Vì vậy phần relay server này phải deploy
**riêng biệt**, ở một nơi chạy được Node.js.

## Deploy lên Render.com (miễn phí, không cần thẻ)

1. Đẩy thư mục `server/` này lên 1 GitHub repo riêng (hoặc repo con).
2. Vào [render.com](https://render.com) → **New** → **Web Service**.
3. Connect repo, chọn thư mục gốc là `server/`.
4. Cấu hình:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Deploy xong, Render cho bạn 1 URL dạng `https://ten-app.onrender.com`.
6. Đổi `https://` thành `wss://` → đó chính là địa chỉ dán vào ô
   **"Địa chỉ relay server"** trong popup 🌐 Chơi Online của game.

> ⚠️ Free tier của Render sẽ "ngủ" sau ~15 phút không có traffic — lần kết
> nối đầu tiên sau khi ngủ có thể mất 20-30 giây để server thức dậy.

## Deploy lên Railway / Fly.io / VPS riêng

Server này là Node.js thuần (`ws` là dependency duy nhất), chạy được ở bất
kỳ nơi nào hỗ trợ Node ≥ 18 và mở được cổng WebSocket:

```bash
cd server
npm install
npm start
```

Mặc định lắng nghe cổng `process.env.PORT || 8080`. Nếu deploy sau reverse
proxy (Nginx/Caddy) nhớ bật hỗ trợ WebSocket upgrade (`Upgrade`/`Connection`
headers), và dùng `wss://` nếu bật HTTPS.

## Chạy thử ở localhost

```bash
cd server
npm install
npm start
# server chạy tại ws://localhost:8080
```

Dán `ws://localhost:8080` vào ô địa chỉ server trong game khi test trên
cùng 1 máy (2 tab trình duyệt), hoặc `ws://<IP-LAN>:8080` khi test 2 máy
trong cùng mạng LAN.

## Giới hạn hiện tại

- Không có reconnect: nếu 1 trong 2 bên rớt mạng, trận đấu kết thúc,
  phải tạo phòng mới.
- Phần thưởng (xu/EXP/leaderboard) khi thắng chỉ được lưu vào máy đang
  đóng vai **host** — máy guest chưa được cộng riêng. Cần thêm cơ chế
  đồng bộ tiến trình 2 chiều nếu muốn công bằng cho cả 2 bên.
- Chỉ hỗ trợ 1-vs-1 (đúng với giới hạn 2 người chơi hiện tại của game).
