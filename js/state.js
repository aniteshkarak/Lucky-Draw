/**
 * State Management & Data Store for Lucky Draw
 */

const PRESETS = {
    tech: {
        name: 'Tech & Gadgets',
        icon: '📱',
        items: [
            { id: '1', text: 'iPhone 16 Pro Max', icon: '📱', color: '#FF2E63', weight: 1, active: true },
            { id: '2', text: 'MacBook Air M3', icon: '💻', color: '#9B51E0', weight: 1, active: true },
            { id: '3', text: 'Sony WH-1000XM5', icon: '🎧', color: '#00F0FF', weight: 1, active: true },
            { id: '4', text: 'iPad Pro 11"', icon: '📲', color: '#FFB800', weight: 1, active: true },
            { id: '5', text: 'Apple Watch Ultra 2', icon: '⌚', color: '#00F5A0', weight: 1, active: true },
            { id: '6', text: 'AirPods Pro Gen 2', icon: '🎵', color: '#FF6B6B', weight: 1, active: true },
            { id: '7', text: '4K Gaming Monitor', icon: '🖥️', color: '#4D96FF', weight: 1, active: true },
            { id: '8', text: 'Mechanical RGB Keyboard', icon: '⌨️', color: '#FF7597', weight: 1, active: true }
        ]
    },
    party: {
        name: 'Office Party & Perks',
        icon: '🎉',
        items: [
            { id: '1', text: '$500 Amazon Gift Card', icon: '💳', color: '#FFB800', weight: 1, active: true },
            { id: '2', text: 'Weekend Hotel Staycation', icon: '🏨', color: '#FF2E63', weight: 1, active: true },
            { id: '3', text: '1 Extra Paid Vacation Day', icon: '🏖️', color: '#00F5A0', weight: 1, active: true },
            { id: '4', text: 'Gourmet Dinner for 2', icon: '🍷', color: '#9B51E0', weight: 1, active: true },
            { id: '5', text: 'Espresso Coffee Machine', icon: '☕', color: '#FF6B6B', weight: 1, active: true },
            { id: '6', text: '1 Year Gym / Spa Pass', icon: '🏋️', color: '#00F0FF', weight: 1, active: true },
            { id: '7', text: '$100 Uber Eats Voucher', icon: '🍔', color: '#FFE600', weight: 1, active: true },
            { id: '8', text: 'Smart Home Speaker', icon: '🔊', color: '#4D96FF', weight: 1, active: true }
        ]
    },
    cash: {
        name: 'Cash & Jackpots',
        icon: '💰',
        items: [
            { id: '1', text: '$1,000 Grand Jackpot', icon: '💎', color: '#FFD700', weight: 1, active: true },
            { id: '2', text: '$500 Cash Reward', icon: '💵', color: '#00F5A0', weight: 1, active: true },
            { id: '3', text: '$250 Shopping Spree', icon: '🛍️', color: '#FF2E63', weight: 1, active: true },
            { id: '4', text: '$100 Fuel Card', icon: '⛽', color: '#4D96FF', weight: 1, active: true },
            { id: '5', text: '$50 Starbucks Card', icon: '☕', color: '#9B51E0', weight: 1, active: true },
            { id: '6', text: '$25 Surprise Bonus', icon: '🎁', color: '#FFB800', weight: 1, active: true },
            { id: '7', text: 'Golden Mystery Box', icon: '📦', color: '#00F0FF', weight: 1, active: true },
            { id: '8', text: 'Double Spin Token', icon: '🎰', color: '#FF7597', weight: 1, active: true }
        ]
    },
    names: {
        name: 'Team / Participants',
        icon: '👥',
        items: [
            { id: '1', text: 'Alex Turner', icon: '👤', color: '#FF2E63', weight: 1, active: true },
            { id: '2', text: 'Sophia Martinez', icon: '👤', color: '#9B51E0', weight: 1, active: true },
            { id: '3', text: 'David Kim', icon: '👤', color: '#00F0FF', weight: 1, active: true },
            { id: '4', text: 'Emma Watson', icon: '👤', color: '#FFB800', weight: 1, active: true },
            { id: '5', text: 'Liam Johnson', icon: '👤', color: '#00F5A0', weight: 1, active: true },
            { id: '6', text: 'Olivia Chen', icon: '👤', color: '#FF6B6B', weight: 1, active: true },
            { id: '7', text: 'Lucas Vance', icon: '👤', color: '#4D96FF', weight: 1, active: true },
            { id: '8', text: 'Mia Rodriguez', icon: '👤', color: '#FF7597', weight: 1, active: true }
        ]
    },
    numbers: {
        name: 'Lucky Numbers (1 - 20)',
        icon: '🔢',
        items: Array.from({ length: 16 }, (_, i) => ({
            id: String(i + 1),
            text: `Number #${i + 1}`,
            icon: '🎲',
            color: [
                '#FF2E63', '#9B51E0', '#00F0FF', '#FFB800',
                '#00F5A0', '#FF6B6B', '#4D96FF', '#FF7597'
            ][i % 8],
            weight: 1,
            active: true
        }))
    }
};

const PALETTE = [
    '#FF2E63', '#9B51E0', '#00F0FF', '#FFB800',
    '#00F5A0', '#FF6B6B', '#4D96FF', '#FF7597',
    '#FFE600', '#7928CA', '#20E3B2', '#FF416C'
];

class StateStore {
    constructor() {
        this.storageKey = 'lucky_draw_state_v1';
        this.state = this.getInitialState();
        this.listeners = [];
        this.loadFromStorage();
    }

    getInitialState() {
        return {
            title: '✨ The Grand Lucky Draw ✨',
            subtitle: 'Spin the wheel, pull the slot, or unlock mystery gold boxes to win!',
            currentMode: 'wheel', // 'wheel' | 'slots' | 'boxes' | 'rapid'
            items: JSON.parse(JSON.stringify(PRESETS.tech.items)),
            currentPresetKey: 'tech',
            winners: [],
            settings: {
                eliminateWinners: false,
                spinDuration: 'normal', // 'fast' (3s) | 'normal' (5s) | 'suspense' (8s)
                soundMuted: false,
                soundVolume: 0.8,
                confettiBurst: true
            }
        };
    }

    subscribe(fn) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    }

    notify(changeType = 'update') {
        this.saveToStorage();
        this.listeners.forEach(fn => fn(this.state, changeType));
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save to localStorage', e);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.state = {
                    ...this.getInitialState(),
                    ...parsed,
                    settings: {
                        ...this.getInitialState().settings,
                        ...(parsed.settings || {})
                    }
                };
            }
        } catch (e) {
            console.warn('Using default state', e);
        }
    }

    // Get active items available for draw
    getActiveItems() {
        return this.state.items.filter(item => item.active !== false);
    }

    setMode(mode) {
        this.state.currentMode = mode;
        this.notify('mode');
    }

    loadPreset(presetKey) {
        if (!PRESETS[presetKey]) return;
        this.state.currentPresetKey = presetKey;
        this.state.items = JSON.parse(JSON.stringify(PRESETS[presetKey].items));
        this.notify('items');
    }

    addItem(text, icon = '🎁', color = null, weight = 1) {
        if (!text || !text.trim()) return;
        const assignedColor = color || PALETTE[this.state.items.length % PALETTE.length];
        const newItem = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            text: text.trim(),
            icon: icon || '🎁',
            color: assignedColor,
            weight: Number(weight) || 1,
            active: true
        };
        this.state.items.push(newItem);
        this.notify('items');
        return newItem;
    }

    bulkAddItems(textList) {
        if (!textList) return;
        const lines = textList.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        if (lines.length === 0) return;

        lines.forEach((name, i) => {
            const assignedColor = PALETTE[(this.state.items.length + i) % PALETTE.length];
            this.state.items.push({
                id: 'item_' + Date.now() + '_' + i,
                text: name,
                icon: '🎯',
                color: assignedColor,
                weight: 1,
                active: true
            });
        });
        this.notify('items');
    }

    updateItem(id, updates) {
        const item = this.state.items.find(i => i.id === id);
        if (item) {
            Object.assign(item, updates);
            this.notify('items');
        }
    }

    removeItem(id) {
        this.state.items = this.state.items.filter(i => i.id !== id);
        this.notify('items');
    }

    clearItems() {
        this.state.items = [];
        this.notify('items');
    }

    toggleItemActive(id) {
        const item = this.state.items.find(i => i.id === id);
        if (item) {
            item.active = !item.active;
            this.notify('items');
        }
    }

    recordWinner(item, mode = this.state.currentMode, extraNote = '') {
        const now = new Date();
        const winner = {
            id: 'win_' + Date.now(),
            itemId: item.id,
            name: item.text,
            icon: item.icon,
            color: item.color,
            mode: mode,
            note: extraNote,
            timestamp: now.getTime(),
            dateFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        this.state.winners.unshift(winner);

        // If eliminate option is active, disable or remove item
        if (this.state.settings.eliminateWinners) {
            const target = this.state.items.find(i => i.id === item.id);
            if (target) {
                target.active = false;
            }
        }

        this.notify('winner');
        return winner;
    }

    recordMultipleWinners(items, mode = 'rapid') {
        const now = new Date();
        const newWinners = items.map((item, idx) => ({
            id: 'win_' + Date.now() + '_' + idx,
            itemId: item.id,
            name: item.text,
            icon: item.icon,
            color: item.color,
            mode: mode,
            rank: idx + 1,
            timestamp: now.getTime(),
            dateFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }));

        this.state.winners.unshift(...newWinners);

        if (this.state.settings.eliminateWinners) {
            const itemIds = new Set(items.map(i => i.id));
            this.state.items.forEach(i => {
                if (itemIds.has(i.id)) i.active = false;
            });
        }

        this.notify('winner');
        return newWinners;
    }

    clearWinners() {
        this.state.winners = [];
        this.notify('winner');
    }

    updateSettings(newSettings) {
        this.state.settings = { ...this.state.settings, ...newSettings };
        this.notify('settings');
    }

    updateBranding(title, subtitle) {
        if (title !== undefined) this.state.title = title;
        if (subtitle !== undefined) this.state.subtitle = subtitle;
        this.notify('branding');
    }

    exportWinnersCSV() {
        if (this.state.winners.length === 0) return null;
        const headers = ['Rank / Index', 'Winner Name', 'Game Mode', 'Time', 'Date'];
        const rows = this.state.winners.map((w, idx) => [
            idx + 1,
            `"${w.name.replace(/"/g, '""')}"`,
            w.mode,
            w.dateFormatted,
            new Date(w.timestamp).toLocaleDateString()
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return csvContent;
    }

    downloadCSV(filename = 'lucky_draw_winners.csv') {
        const csv = this.exportWinnersCSV();
        if (!csv) return false;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    }
}

window.stateStore = new StateStore();
window.PRESETS = PRESETS;
