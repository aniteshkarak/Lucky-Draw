/**
 * Lucky Draw - Master Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Core Engines
    const sound = window.soundEngine;
    const confetti = window.confettiEngine;
    const store = window.stateStore;
    const wheel = window.wheelEngine;
    const slots = window.slotMachineEngine;
    const mysteryBoxes = window.mysteryBoxEngine;
    const rapidDraw = window.rapidDrawEngine;

    // DOM Elements
    const titleEl = document.getElementById('app-title');
    const subtitleEl = document.getElementById('app-subtitle');
    const modeTabs = document.querySelectorAll('.mode-tab');
    const gameViews = document.querySelectorAll('.game-view');

    // Controls
    const btnSpinWheel = document.getElementById('btn-spin-wheel');
    const btnSpinSlots = document.getElementById('btn-spin-slots');
    const btnDrawBox = document.getElementById('btn-draw-box');
    const btnResetBoxes = document.getElementById('btn-reset-boxes');
    const btnStartRapid = document.getElementById('btn-start-rapid');
    const rapidWinnerCount = document.getElementById('rapid-winner-count');
    const rapidPodium = document.getElementById('rapid-podium');

    // Modals & Drawers
    const winnerModal = document.getElementById('winner-modal');
    const winnerModalClose = document.getElementById('winner-modal-close');
    const winnerModalAgain = document.getElementById('winner-modal-again');
    const winnerModalEliminate = document.getElementById('winner-modal-eliminate');
    const winnerItemIcon = document.getElementById('winner-item-icon');
    const winnerItemName = document.getElementById('winner-item-name');
    const winnerBadgeText = document.getElementById('winner-badge-text');

    // Items Drawer
    const btnOpenItems = document.getElementById('btn-open-items');
    const itemsDrawer = document.getElementById('items-drawer');
    const itemsDrawerClose = document.getElementById('items-drawer-close');
    const itemsListContainer = document.getElementById('items-list');
    const btnAddItem = document.getElementById('btn-add-item');
    const inputNewItemText = document.getElementById('input-new-item-text');
    const inputNewItemIcon = document.getElementById('input-new-item-icon');
    const btnBulkAdd = document.getElementById('btn-bulk-add');
    const textareaBulk = document.getElementById('textarea-bulk-items');
    const presetSelect = document.getElementById('preset-select');
    const btnClearAllItems = document.getElementById('btn-clear-all-items');

    // History Drawer
    const btnOpenHistory = document.getElementById('btn-open-history');
    const historyDrawer = document.getElementById('history-drawer');
    const historyDrawerClose = document.getElementById('history-drawer-close');
    const historyListContainer = document.getElementById('history-list');
    const historyBadgeCount = document.getElementById('history-count-badge');
    const btnExportCSV = document.getElementById('btn-export-csv');
    const btnClearHistory = document.getElementById('btn-clear-history');

    // Settings Modal
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const settingsModal = document.getElementById('settings-modal');
    const settingsModalClose = document.getElementById('settings-modal-close');
    const toggleMute = document.getElementById('toggle-sound');
    const volumeSlider = document.getElementById('slider-volume');
    const selectSpinSpeed = document.getElementById('select-spin-speed');
    const toggleEliminate = document.getElementById('toggle-eliminate-winners');
    const inputCustomTitle = document.getElementById('input-custom-title');
    const inputCustomSubtitle = document.getElementById('input-custom-subtitle');
    const btnSaveBranding = document.getElementById('btn-save-branding');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    let currentWinnerItem = null;

    // Initialize Canvas & Sub-systems
    wheel.init('wheel-canvas');
    confetti.init('confetti-canvas');
    slots.init('slot-machine-container');
    mysteryBoxes.init('mystery-box-grid');
    rapidDraw.init('rapid-draw-container');

    // Sync UI from Store
    function syncStateToUI() {
        const state = store.state;
        const activeItems = store.getActiveItems();

        // Branding
        if (titleEl) titleEl.textContent = state.title;
        if (subtitleEl) subtitleEl.textContent = state.subtitle;
        if (inputCustomTitle) inputCustomTitle.value = state.title;
        if (inputCustomSubtitle) inputCustomSubtitle.value = state.subtitle;

        // Modes
        modeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === state.currentMode);
        });
        gameViews.forEach(view => {
            view.classList.toggle('active', view.id === `view-${state.currentMode}`);
        });

        // Engines Items
        wheel.setItems(activeItems);
        slots.setItems(activeItems);
        mysteryBoxes.setItems(activeItems);
        rapidDraw.setItems(activeItems);

        // Update items list inside drawer
        renderItemsList();

        // Update history drawer & badge
        renderHistoryList();

        // Settings sync
        if (toggleMute) toggleMute.checked = !state.settings.soundMuted;
        if (volumeSlider) volumeSlider.value = state.settings.soundVolume * 100;
        if (selectSpinSpeed) selectSpinSpeed.value = state.settings.spinDuration;
        if (toggleEliminate) toggleEliminate.checked = state.settings.eliminateWinners;

        sound.setMuted(state.settings.soundMuted);
        sound.setVolume(state.settings.soundVolume);
    }

    function renderItemsList() {
        if (!itemsListContainer) return;
        const items = store.state.items;
        const totalCount = items.length;
        const activeCount = items.filter(i => i.active !== false).length;

        const countHeader = document.getElementById('items-count-summary');
        if (countHeader) {
            countHeader.textContent = `${activeCount} active / ${totalCount} total items`;
        }

        if (items.length === 0) {
            itemsListContainer.innerHTML = `
                <div class="empty-state-card">
                    <p>No items in current pool.</p>
                    <span>Add items above or choose a preset!</span>
                </div>
            `;
            return;
        }

        let html = '';
        items.forEach(item => {
            html += `
                <div class="item-row ${item.active === false ? 'item-inactive' : ''}" data-id="${item.id}">
                    <div class="item-color-indicator" style="background-color: ${item.color || '#00F0FF'};"></div>
                    <span class="item-icon-tag">${item.icon || '🎁'}</span>
                    <input type="text" class="item-edit-name" value="${item.text.replace(/"/g, '&quot;')}" />
                    <label class="item-toggle-label" title="Enable/Disable in draw">
                        <input type="checkbox" class="item-toggle-active" ${item.active !== false ? 'checked' : ''} />
                        <span class="custom-chk"></span>
                    </label>
                    <button class="item-delete-btn" title="Remove Item">✕</button>
                </div>
            `;
        });

        itemsListContainer.innerHTML = html;

        // Bind events for item edits & deletes
        itemsListContainer.querySelectorAll('.item-row').forEach(row => {
            const id = row.dataset.id;
            const nameInput = row.querySelector('.item-edit-name');
            const toggleChk = row.querySelector('.item-toggle-active');
            const deleteBtn = row.querySelector('.item-delete-btn');

            nameInput.addEventListener('change', () => {
                store.updateItem(id, { text: nameInput.value });
            });

            toggleChk.addEventListener('change', () => {
                store.toggleItemActive(id);
            });

            deleteBtn.addEventListener('click', () => {
                sound.playClick();
                store.removeItem(id);
            });
        });
    }

    function renderHistoryList() {
        const winners = store.state.winners;
        if (historyBadgeCount) {
            historyBadgeCount.textContent = winners.length;
            historyBadgeCount.style.display = winners.length > 0 ? 'inline-flex' : 'none';
        }

        if (!historyListContainer) return;

        if (winners.length === 0) {
            historyListContainer.innerHTML = `
                <div class="empty-state-card">
                    <p>No winners drawn yet.</p>
                    <span>Start a game mode to record winners!</span>
                </div>
            `;
            return;
        }

        let html = '';
        winners.forEach((w, idx) => {
            html += `
                <div class="history-card">
                    <div class="history-rank">#${winners.length - idx}</div>
                    <div class="history-icon" style="background: ${w.color || '#FFB800'}22; border-color: ${w.color || '#FFB800'}">${w.icon || '🏆'}</div>
                    <div class="history-info">
                        <div class="history-name">${w.name}</div>
                        <div class="history-meta">
                            <span class="history-mode-tag">${w.mode.toUpperCase()}</span>
                            <span class="history-time">${w.dateFormatted}</span>
                        </div>
                    </div>
                    <button class="history-replay-btn" title="Replay celebration" data-name="${w.name.replace(/"/g, '&quot;')}" data-icon="${w.icon || '🏆'}">🎉</button>
                </div>
            `;
        });

        historyListContainer.innerHTML = html;

        // Replay button events
        historyListContainer.querySelectorAll('.history-replay-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sound.playFanfare();
                confetti.burst();
            });
        });
    }

    // Winner Reveal Trigger
    function handleWinner(winnerItem, mode = store.state.currentMode) {
        currentWinnerItem = winnerItem;
        const recorded = store.recordWinner(winnerItem, mode);

        // Sound & Confetti
        sound.playFanfare();
        confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 140);
        confetti.shower(3500);

        // Populate Modal
        if (winnerItemIcon) winnerItemIcon.textContent = winnerItem.icon || '🏆';
        if (winnerItemName) winnerItemName.textContent = winnerItem.text;
        if (winnerBadgeText) winnerBadgeText.textContent = `WON VIA ${mode.toUpperCase()}!`;

        // Open Winner Modal with slight dramatic pause
        setTimeout(() => {
            winnerModal.classList.add('active');
        }, 400);
    }

    function handleMultipleWinners(winnersList) {
        store.recordMultipleWinners(winnersList, 'rapid');
        sound.playFanfare();
        confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 160);
        confetti.shower(4000);

        // Render Podium Cards in Rapid View
        if (rapidPodium) {
            let html = '';
            winnersList.forEach((w, idx) => {
                const rankLabels = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place', '🎖️ Winner', '🎖️ Winner'];
                const rankClass = idx === 0 ? 'podium-gold' : (idx === 1 ? 'podium-silver' : (idx === 2 ? 'podium-bronze' : 'podium-standard'));
                html += `
                    <div class="podium-card ${rankClass} animate-fade-in">
                        <div class="podium-badge">${rankLabels[idx] || '🎖️ Winner'}</div>
                        <div class="podium-icon">${w.icon || '🏆'}</div>
                        <div class="podium-name">${w.text}</div>
                    </div>
                `;
            });
            rapidPodium.innerHTML = html;
        }
    }

    // Bind Game Actions
    if (btnSpinWheel) {
        btnSpinWheel.addEventListener('click', () => {
            const active = store.getActiveItems();
            if (active.length === 0) {
                alert('Please add active items to spin!');
                return;
            }
            wheel.spin(store.state.settings.spinDuration, (winner) => {
                handleWinner(winner, 'Wheel');
            });
        });
    }

    // Wheel Canvas Click to Spin
    const wheelCanvasEl = document.getElementById('wheel-canvas');
    if (wheelCanvasEl) {
        wheelCanvasEl.addEventListener('click', () => {
            if (btnSpinWheel) btnSpinWheel.click();
        });
    }

    if (btnSpinSlots) {
        btnSpinSlots.addEventListener('click', () => {
            const active = store.getActiveItems();
            if (active.length === 0) {
                alert('Please add active items to spin the slot machine!');
                return;
            }
            slots.spin(store.state.settings.spinDuration, (winner) => {
                handleWinner(winner, 'Slots');
            });
        });
    }

    if (btnDrawBox) {
        btnDrawBox.addEventListener('click', () => {
            const active = store.getActiveItems();
            if (active.length === 0) {
                alert('Please add active items!');
                return;
            }
            mysteryBoxes.pickRandomBox((winner) => {
                handleWinner(winner, 'Mystery Box');
            });
        });
    }

    if (btnResetBoxes) {
        btnResetBoxes.addEventListener('click', () => {
            sound.playClick();
            mysteryBoxes.renderBoxes();
        });
    }

    if (btnStartRapid) {
        btnStartRapid.addEventListener('click', () => {
            const active = store.getActiveItems();
            if (active.length === 0) {
                alert('Please add active items!');
                return;
            }
            const count = parseInt(rapidWinnerCount ? rapidWinnerCount.value : '3', 10);
            if (rapidPodium) rapidPodium.innerHTML = '';
            rapidDraw.startDraw(count, (winners) => {
                handleMultipleWinners(winners);
            });
        });
    }

    // Mode Switch Tabs
    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.mode;
            sound.playClick();
            store.setMode(mode);
        });
    });

    // Drawers & Modals Toggles
    if (btnOpenItems) {
        btnOpenItems.addEventListener('click', () => {
            sound.playClick();
            itemsDrawer.classList.add('active');
        });
    }

    if (itemsDrawerClose) {
        itemsDrawerClose.addEventListener('click', () => {
            sound.playClick();
            itemsDrawer.classList.remove('active');
        });
    }

    if (btnOpenHistory) {
        btnOpenHistory.addEventListener('click', () => {
            sound.playClick();
            historyDrawer.classList.add('active');
        });
    }

    if (historyDrawerClose) {
        historyDrawerClose.addEventListener('click', () => {
            sound.playClick();
            historyDrawer.classList.remove('active');
        });
    }

    if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', () => {
            sound.playClick();
            settingsModal.classList.add('active');
        });
    }

    if (settingsModalClose) {
        settingsModalClose.addEventListener('click', () => {
            sound.playClick();
            settingsModal.classList.remove('active');
        });
    }

    // Winner Modal Actions
    if (winnerModalClose) {
        winnerModalClose.addEventListener('click', () => {
            sound.playClick();
            winnerModal.classList.remove('active');
        });
    }

    if (winnerModalAgain) {
        winnerModalAgain.addEventListener('click', () => {
            sound.playClick();
            winnerModal.classList.remove('active');
            // Re-trigger current mode spin
            setTimeout(() => {
                if (store.state.currentMode === 'wheel') btnSpinWheel.click();
                else if (store.state.currentMode === 'slots') btnSpinSlots.click();
                else if (store.state.currentMode === 'boxes') btnDrawBox.click();
            }, 300);
        });
    }

    if (winnerModalEliminate) {
        winnerModalEliminate.addEventListener('click', () => {
            if (currentWinnerItem) {
                store.toggleItemActive(currentWinnerItem.id);
                sound.playClick();
            }
            winnerModal.classList.remove('active');
        });
    }

    // Add Item Controls
    if (btnAddItem) {
        btnAddItem.addEventListener('click', () => {
            const text = inputNewItemText.value;
            const icon = inputNewItemIcon.value || '🎁';
            if (text && text.trim()) {
                sound.playClick();
                store.addItem(text, icon);
                inputNewItemText.value = '';
            }
        });

        inputNewItemText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                btnAddItem.click();
            }
        });
    }

    // Bulk Add
    if (btnBulkAdd) {
        btnBulkAdd.addEventListener('click', () => {
            const text = textareaBulk.value;
            if (text && text.trim()) {
                sound.playClick();
                store.bulkAddItems(text);
                textareaBulk.value = '';
            }
        });
    }

    // Presets Switcher
    if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
            const key = e.target.value;
            if (key) {
                sound.playClick();
                store.loadPreset(key);
            }
        });
    }

    // Clear items
    if (btnClearAllItems) {
        btnClearAllItems.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all items from the pool?')) {
                sound.playClick();
                store.clearItems();
            }
        });
    }

    // Clear History
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the winner history?')) {
                sound.playClick();
                store.clearWinners();
            }
        });
    }

    // Export CSV
    if (btnExportCSV) {
        btnExportCSV.addEventListener('click', () => {
            sound.playClick();
            const success = store.downloadCSV();
            if (!success) {
                alert('No winners to export yet!');
            }
        });
    }

    // Settings Updates
    if (toggleMute) {
        toggleMute.addEventListener('change', (e) => {
            const soundEnabled = e.target.checked;
            store.updateSettings({ soundMuted: !soundEnabled });
            sound.setMuted(!soundEnabled);
            if (soundEnabled) sound.playClick();
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value) / 100;
            store.updateSettings({ soundVolume: vol });
            sound.setVolume(vol);
        });
    }

    if (selectSpinSpeed) {
        selectSpinSpeed.addEventListener('change', (e) => {
            store.updateSettings({ spinDuration: e.target.value });
        });
    }

    if (toggleEliminate) {
        toggleEliminate.addEventListener('change', (e) => {
            store.updateSettings({ eliminateWinners: e.target.checked });
        });
    }

    if (btnSaveBranding) {
        btnSaveBranding.addEventListener('click', () => {
            const title = inputCustomTitle.value;
            const subtitle = inputCustomSubtitle.value;
            store.updateBranding(title, subtitle);
            sound.playClick();
            settingsModal.classList.remove('active');
        });
    }

    // Fullscreen Toggle
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            sound.playClick();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn('Fullscreen request failed', err);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts if typing inside input / textarea
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            if (winnerModal.classList.contains('active')) {
                winnerModal.classList.remove('active');
                return;
            }
            const mode = store.state.currentMode;
            if (mode === 'wheel' && btnSpinWheel) btnSpinWheel.click();
            else if (mode === 'slots' && btnSpinSlots) btnSpinSlots.click();
            else if (mode === 'boxes' && btnDrawBox) btnDrawBox.click();
            else if (mode === 'rapid' && btnStartRapid) btnStartRapid.click();
        } else if (e.key === 'Escape') {
            winnerModal.classList.remove('active');
            itemsDrawer.classList.remove('active');
            historyDrawer.classList.remove('active');
            settingsModal.classList.remove('active');
        } else if (e.key === 'm' || e.key === 'M') {
            const newMuted = !store.state.settings.soundMuted;
            store.updateSettings({ soundMuted: newMuted });
            sound.setMuted(newMuted);
            if (toggleMute) toggleMute.checked = !newMuted;
        } else if (e.key === 'f' || e.key === 'F') {
            if (btnFullscreen) btnFullscreen.click();
        } else if (['1', '2', '3', '4'].includes(e.key)) {
            const modes = ['wheel', 'slots', 'boxes', 'rapid'];
            const targetMode = modes[parseInt(e.key, 10) - 1];
            if (targetMode) store.setMode(targetMode);
        }
    });

    // Subscribe to State Changes
    store.subscribe(() => {
        syncStateToUI();
    });

    // Initial Load & UI Sync
    syncStateToUI();
});
