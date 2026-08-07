// ===== Tùy chỉnh vị trí nút điều khiển (kéo-thả trên mobile) =====
// Lưu offset (dịch chuyển so với vị trí mặc định) của từng nút theo id,
// áp dụng bằng CSS transform — không đổi layout gốc (flex row) nên không
// phá vỡ CSS có sẵn, chỉ "nhích" nút ra khỏi vị trí mặc định.

const OFFSETS_KEY = 'survivearena_btn_offsets';
const DRAGGABLE_SELECTOR = '.action-btn';

export let dragModeActive = false;

export function loadButtonOffsets() {
    try {
        const raw = localStorage.getItem(OFFSETS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function saveButtonOffsets(offsets) {
    try {
        localStorage.setItem(OFFSETS_KEY, JSON.stringify(offsets));
    } catch {}
}

export function resetButtonOffsets() {
    try {
        localStorage.removeItem(OFFSETS_KEY);
    } catch {}
    document.querySelectorAll(DRAGGABLE_SELECTOR).forEach(el => {
        el.style.transform = '';
    });
}

export function applyButtonOffsets() {
    const offsets = loadButtonOffsets();
    document.querySelectorAll(DRAGGABLE_SELECTOR).forEach(el => {
        const o = offsets[el.id];
        if (o) el.style.transform = `translate(${o.x}px, ${o.y}px)`;
    });
}

export function isDragModeOn() {
    return dragModeActive;
}

let dragCleanupFns = [];

export function enableDragMode() {
    if (dragModeActive) return;
    dragModeActive = true;
    document.body.classList.add('control-edit-mode');

    const offsets = loadButtonOffsets();

    document.querySelectorAll(DRAGGABLE_SELECTOR).forEach(el => {
        let startX = 0, startY = 0, baseX = 0, baseY = 0, dragging = false;

        const getBase = () => {
            const o = offsets[el.id] || { x: 0, y: 0 };
            return o;
        };

        const onPointerDown = (e) => {
            dragging = true;
            const pt = e.touches ? e.touches[0] : e;
            startX = pt.clientX;
            startY = pt.clientY;
            const base = getBase();
            baseX = base.x;
            baseY = base.y;
            e.preventDefault();
            e.stopPropagation();
        };

        const onPointerMove = (e) => {
            if (!dragging) return;
            const pt = e.touches ? e.touches[0] : e;
            const dx = pt.clientX - startX;
            const dy = pt.clientY - startY;
            const nx = baseX + dx;
            const ny = baseY + dy;
            el.style.transform = `translate(${nx}px, ${ny}px)`;
            e.preventDefault();
            e.stopPropagation();
        };

        const onPointerUp = (e) => {
            if (!dragging) return;
            dragging = false;
            const pt = (e.changedTouches ? e.changedTouches[0] : e) || {};
            const dx = (pt.clientX ?? startX) - startX;
            const dy = (pt.clientY ?? startY) - startY;
            offsets[el.id] = { x: baseX + dx, y: baseY + dy };
            saveButtonOffsets(offsets);
        };

        el.addEventListener('touchstart', onPointerDown, { passive: false });
        el.addEventListener('touchmove', onPointerMove, { passive: false });
        el.addEventListener('touchend', onPointerUp, { passive: false });
        el.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        dragCleanupFns.push(() => {
            el.removeEventListener('touchstart', onPointerDown);
            el.removeEventListener('touchmove', onPointerMove);
            el.removeEventListener('touchend', onPointerUp);
            el.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', onPointerUp);
        });
    });
}

export function disableDragMode() {
    if (!dragModeActive) return;
    dragModeActive = false;
    document.body.classList.remove('control-edit-mode');
    dragCleanupFns.forEach(fn => fn());
    dragCleanupFns = [];
}
