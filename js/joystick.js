export function setupJoystick(elementId, knobId, player) {
    const el = document.getElementById(elementId);
    const knob = document.getElementById(knobId);
    if (!el || !knob) return;
    
    const radius = el.offsetWidth / 2;
    let active = false;
    
    function handleMove(clientX, clientY) {
        const rect = el.getBoundingClientRect();
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
        knob.style.transform = 'translate(-50%, -50%)';
        player.input.dx = 0;
        player.input.dy = 0;
        active = false;
    }
    
    // Touch
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        active = true;
        const touch = e.touches[0];
        if (touch) handleMove(touch.clientX, touch.clientY);
    }, { passive: false });
    
    el.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!active) return;
        const touch = e.touches[0];
        if (touch) handleMove(touch.clientX, touch.clientY);
    }, { passive: false });
    
    el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleEnd();
    }, { passive: false });
    
    el.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleEnd();
    }, { passive: false });
    
    // Mouse
    let mouseDown = false;
    el.addEventListener('mousedown', (e) => {
        mouseDown = true;
        handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
        if (mouseDown) handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
        if (mouseDown) { mouseDown = false; handleEnd(); }
    });
}

export function setupButton(btnId, player, key) {
    const el = document.getElementById(btnId);
    if (!el) return;
    
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (key === 'speed') {
            player.input.speed = true;
            setTimeout(() => { player.input.speed = false; }, 100);
        } else if (key === 'weapon') {
            player.input.weapon = true;
        } else {
            player.input[key] = true;
        }
    }, { passive: false });
    
    el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (key !== 'speed' && key !== 'weapon') {
            player.input[key] = false;
        }
        if (key === 'weapon') {
            setTimeout(() => { player.input.weapon = false; }, 100);
        }
    }, { passive: false });
    
    el.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (key !== 'speed' && key !== 'weapon') player.input[key] = false;
    }, { passive: false });
    
    // Mouse
    el.addEventListener('mousedown', () => {
        if (key === 'speed') {
            player.input.speed = true;
            setTimeout(() => { player.input.speed = false; }, 100);
        } else if (key === 'weapon') {
            player.input.weapon = true;
            setTimeout(() => { player.input.weapon = false; }, 100);
        } else {
            player.input[key] = true;
        }
    });
    el.addEventListener('mouseup', () => {
        if (key !== 'speed' && key !== 'weapon') player.input[key] = false;
    });
    el.addEventListener('mouseleave', () => {
        if (key !== 'speed' && key !== 'weapon') player.input[key] = false;
    });
}
