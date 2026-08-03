import { loadData, saveData } from './save.js';

export function getSettings() {
    const data = loadData();
    return data.settings;
}

export function setSetting(key, value) {
    const data = loadData();
    data.settings[key] = value;
    saveData(data);
    applySettings();
}

export function applySettings() {
    const settings = getSettings();
    
    // Âm lượng
    if (window.soundManager) {
        window.soundManager.setVolume(settings.soundVolume);
    }
    
    // Joystick size
    const joyAreas = document.querySelectorAll('.joystick-area');
    const size = settings.joystickSize || 1.0;
    joyAreas.forEach(el => {
        el.style.maxWidth = Math.min(160 * size, 200) + 'px';
    });
}
