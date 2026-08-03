import { loadData, saveData } from './save.js';

export function getSettings() {
    const data = loadData();
    return data.settings || {
        soundVolume: 1.0,
        musicVolume: 0.5,
        vibration: true,
        joystickSize: 1.0,
    };
}

export function setSetting(key, value) {
    const data = loadData();
    if (!data.settings) data.settings = {};
    data.settings[key] = value;
    saveData(data);
    applySettings();
}

export function applySettings() {
    const settings = getSettings();
    
    // Áp dụng âm lượng
    if (window.soundManager) {
        window.soundManager.setVolume(settings.soundVolume);
    }
    
    // Áp dụng kích thước joystick
    const joyAreas = document.querySelectorAll('.joystick-area');
    const size = settings.joystickSize || 1.0;
    joyAreas.forEach(el => {
        el.style.maxWidth = Math.min(160 * size, 200) + 'px';
    });
}
