// ===== Bàn phím tùy chỉnh (rebind) =====
// Lưu trong localStorage, độc lập với save.js (không liên quan điểm/xu).

const KEYMAP_STORAGE_KEY = 'survivearena_keymap';

export function getDefaultKeymap() {
    return {
        p1: { up: 'w', down: 's', left: 'a', right: 'd', shoot: ' ', bomb: 'q', weapon: 'e', reload: 'r', medkit: 'f' },
        p2: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter', bomb: '.', weapon: '/', reload: ';', medkit: "'" }
    };
}

// Nhãn hiển thị cho từng action (dùng cho UI cài đặt)
export const ACTION_LABELS = {
    up: 'Lên', down: 'Xuống', left: 'Trái', right: 'Phải',
    shoot: 'Bắn', bomb: 'Bom', weapon: 'Đổi súng', reload: 'Nạp đạn', medkit: 'Bình máu'
};

export function loadKeymap() {
    try {
        const raw = localStorage.getItem(KEYMAP_STORAGE_KEY);
        if (!raw) return getDefaultKeymap();
        const parsed = JSON.parse(raw);
        const def = getDefaultKeymap();
        // Merge phòng trường hợp thêm action mới sau này mà save cũ chưa có
        return {
            p1: { ...def.p1, ...(parsed.p1 || {}) },
            p2: { ...def.p2, ...(parsed.p2 || {}) }
        };
    } catch {
        return getDefaultKeymap();
    }
}

export function saveKeymap(keymap) {
    try {
        localStorage.setItem(KEYMAP_STORAGE_KEY, JSON.stringify(keymap));
    } catch {}
}

export function resetKeymap() {
    try {
        localStorage.removeItem(KEYMAP_STORAGE_KEY);
    } catch {}
    return getDefaultKeymap();
}

// Chuyển KeyboardEvent.key thành dạng dùng để so sánh nhất quán —
// phím chữ so sánh không phân biệt hoa/thường, phím đặc biệt (Arrow*,
// Enter, Space...) giữ nguyên casing gốc.
export function normalizeKey(key) {
    if (key === ' ') return ' ';
    if (key.length === 1) return key.toLowerCase();
    return key;
}

export function keymapToComparable(keymap) {
    return {
        p1: Object.fromEntries(Object.entries(keymap.p1).map(([k, v]) => [k, normalizeKey(v)])),
        p2: Object.fromEntries(Object.entries(keymap.p2).map(([k, v]) => [k, normalizeKey(v)]))
    };
}
