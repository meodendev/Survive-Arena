# ⚔️ Survive Arena

Battle Royale trên điện thoại - 2 người chơi cùng máy hoặc đấu với Bot.

## 🎮 Tính năng

- 👥 2 người chơi trên cùng 1 điện thoại
- 🤖 Chế độ đấu với Bot
- 🎯 6 loại súng: Pistol, Shotgun, Rifle, Sniper, SMG, AK-47
- 💣 Bom, tăng tốc, khiên
- ❤️ Bình máu
- 🌧️ Vòng bo thu hẹp
- 🗺️ Bản đồ có chướng ngại vật
- 💥 Hiệu ứng hạt
- 🎵 Âm thanh (Web Audio)

## 🖥️ Điều khiển

### Trên điện thoại
| P1 (trái) | P2 (phải) |
|-----------|-----------|
| Joystick trái | Joystick phải |
| 🔥 Bắn | 🔥 Bắn |
| 💣 Bom | 💣 Bom |
| ⚡ Tăng tốc | ⚡ Tăng tốc |
| 🔫 Đổi súng | 🔫 Đổi súng |

### Trên PC
| P1 | P2 |
|----|----|
| `WASD` di chuyển | `⬆ ⬇ ⬅ ➡` di chuyển |
| `Space` bắn | `Enter` bắn |
| `Q` bom | `.` bom |
| `E` đổi súng | `/` đổi súng |

## 🚀 Cách chạy

1. Mở `index.html` trong trình duyệt (qua local server vì `main.js` dùng ES modules — không mở trực tiếp bằng `file://` được)
2. Chọn chế độ chơi
3. Bắt đầu!

## 🌐 Chơi Online

Chế độ Online dùng WebSocket, host-authoritative (máy tạo phòng tự mô
phỏng vật lý, máy vào phòng chỉ nhận state và gửi input). Cần deploy 1
relay server nhỏ riêng (không chạy được trên GitHub Pages vì đó là static
hosting) — xem hướng dẫn đầy đủ ở [`server/README.md`](server/README.md).

Tóm tắt: deploy `server/` lên Render/Railway/VPS bất kỳ chạy Node ≥ 18 →
copy địa chỉ WebSocket (`wss://...`) → dán vào popup 🌐 Chơi Online trong
game → 1 người **Tạo phòng**, người kia **Vào phòng** bằng mã 5 ký tự.

## 📁 Cấu trúc dự án
