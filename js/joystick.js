export function setupJoystick(elementId, knobId, player) {
    const el = document.getElementById(elementId);
    const knob = document.getElementById(knobId);
    if (!el || !knob) return;
    
    let active = false;
    let touchId = null;
    
    function getPos(clientX, clientY) {
        const rect = el.getBoundingClientRect();
        const radius = el.offsetWidth / 2;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const dist = Math.hypot(dx, dy);
        const maxDist = radius * 0.7;
        if (dist > maxDist) {
            dx = dx / dist * maxDist;
            dy = dy / dist * maxDist;
        }
        knob.style.transform = `translate(${dx - radius*0.19}px, ${dy - radius*0.19}px)`;
        const norm = Math.hypot(dx, dy);
        if (norm > 5) {
            player.input.dx = dx / maxDist;
            player.input.dy = dy / maxDist;
        } else {
            player.input.dx = 0;
            player.input.dy = 0;
        }
    }
    
    function handleEnd() {
        const radius = el.offsetWidth / 2;
        knob.style.transform = 'translate(-50%, -50%)';
        player.input.dx = 0;
        player.input.dy = 0;
        active = false;
        touchId = null;
    }
    
    // ===== TOUCH EVENTS (iPhone compatible) =====
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.changedTouches[0];
        if (touch) {
            touchId = touch.identifier;
            active = true;
            getPos(touch.clientX, touch.clientY);
        }
    }, { passive: false });
    
    el.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!active) return;
        // Tìm đúng touch bằng identifier
        let touch = null;
        for (const t of e.changedTouches) {
            if (t.identifier === touchId || touchId === null) {
                touch = t;
                break;
            }
        }
        if (!touch) touch = e.changedTouches[0];
        if (touch) {
            getPos(touch.clientX, touch.clientY);
        }
    }, { passive: false });
    
    el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Kiểm tra xem touch kết thúc có phải là touch đang active không
        for (const touch of e.changedTouches) {
            if (touch.identifier === touchId || touchId === null) {
                handleEnd();
                break;
            }
        }
    }, { passive: false });
    
    el.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleEnd();
    }, { passive: false });
    
    // ===== MOUSE EVENTS (Desktop) =====
    let mouseDown = false;
    el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        mouseDown = true;
        getPos(e.clientX, e.clientY);
    });
    
    window.addEventListener('mousemove', (e) => {
        if (mouseDown) getPos(e.clientX, e.clientY);
    });
    
    window.addEventListener('mouseup', () => {
        if (mouseDown) {
            mouseDown = false;
            handleEnd();
        }
    });
}

export function setupButton(btnId, player, key) {
    const el = document.getElementById(btnId);
    if (!el) return;
    
    // ===== TOUCH EVENTS (iPhone compatible) =====
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (key === 'speed' || key === 'weapon' || key === 'reload' || key === 'medkit') {
            player.input[key] = true;
            setTimeout(() => { player.input[key] = false; }, 100);
        } else {
            player.input[key] = true;
        }
        // Rung nhẹ (nếu hỗ trợ)
        if (navigator.vibrate) navigator.vibrate(10);
    }, { passive: false });
    
    el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (key !== 'speed' && key !== 'weapon' && key !== 'reload' && key !== 'medkit') {
            player.input[key] = false;
        }
    }, { passive: false });
    
    el.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (key !== 'speed' && key !== 'weapon' && key !== 'reload' && key !== 'medkit') {
            player.input[key] = false;
        }
    }, { passive: false });
    
    // ===== MOUSE EVENTS (Desktop) =====
    el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (key === 'speed' || key === 'weapon' || key === 'reload' || key === 'medkit') {
            player.input[key] = true;
            setTimeout(() => { player.input[key] = false; }, 100);
        } else {
            player.input[key] = true;
        }
    });
    
    el.addEventListener('mouseup', (e) => {
        e.preventDefault();
        if (key !== 'speed' && key !== 'weapon' && key !== 'reload' && key !== 'medkit') {
            player.input[key] = false;
        }
    });
    
    el.addEventListener('mouseleave', () => {
        if (key !== 'speed' && key !== 'weapon' && key !== 'reload' && key !== 'medkit') {
            player.input[key] = false;
        }
    });
}
