/**
 * Vegas Slot Machine Engine
 * Realistic rolling reels, mechanical lever interaction & jackpot detection
 */
class SlotMachineEngine {
    constructor() {
        this.container = null;
        this.isSpinning = false;
        this.items = [];
        this.reels = [];
        this.onFinishCallback = null;
    }

    init(containerId = 'slot-machine-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.renderSlotsStructure();
    }

    setItems(items) {
        this.items = items || [];
        this.populateReels();
    }

    renderSlotsStructure() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="slot-cabinet">
                <div class="slot-header-lights">
                    <span class="light-dot"></span>
                    <span class="light-dot"></span>
                    <span class="light-dot"></span>
                    <span class="slot-jackpot-title">🎰 VEGAS JACKPOT 🎰</span>
                    <span class="light-dot"></span>
                    <span class="light-dot"></span>
                    <span class="light-dot"></span>
                </div>
                <div class="slot-display-window">
                    <div class="slot-payline"></div>
                    <div class="slot-reels-wrapper">
                        <div class="slot-reel" id="reel-0"><div class="slot-strip"></div></div>
                        <div class="slot-reel" id="reel-1"><div class="slot-strip"></div></div>
                        <div class="slot-reel" id="reel-2"><div class="slot-strip"></div></div>
                    </div>
                </div>
                <div class="slot-lever-container" id="slot-lever">
                    <div class="slot-lever-ball"></div>
                    <div class="slot-lever-rod"></div>
                    <div class="slot-lever-base"></div>
                </div>
            </div>
        `;

        const lever = document.getElementById('slot-lever');
        if (lever) {
            lever.addEventListener('click', () => {
                if (!this.isSpinning) {
                    lever.classList.add('pulled');
                    if (window.soundEngine) window.soundEngine.playLever();
                    setTimeout(() => lever.classList.remove('pulled'), 600);
                    
                    const triggerBtn = document.getElementById('btn-spin-slots');
                    if (triggerBtn) triggerBtn.click();
                }
            });
        }
    }

    populateReels() {
        if (!this.items || this.items.length === 0) return;

        for (let r = 0; r < 3; r++) {
            const reelEl = document.getElementById(`reel-${r}`);
            if (!reelEl) continue;
            const strip = reelEl.querySelector('.slot-strip');
            if (!strip) continue;

            // Build a repeating strip of items
            let html = '';
            // Repeat 8 times to provide enough scrolling track
            for (let loop = 0; loop < 8; loop++) {
                this.items.forEach(item => {
                    html += `
                        <div class="slot-item" style="border-left-color: ${item.color || '#00F0FF'}">
                            <span class="slot-item-icon">${item.icon || '🎁'}</span>
                            <span class="slot-item-name">${item.text}</span>
                        </div>
                    `;
                });
            }
            strip.innerHTML = html;
            strip.style.transform = 'translateY(0px)';
        }
    }

    spin(durationSetting = 'normal', onFinish) {
        if (this.isSpinning || this.items.length === 0) return false;

        this.isSpinning = true;
        this.onFinishCallback = onFinish;

        // Choose outcome:
        // 60% chance 3 matching (pure jackpot winner from items)
        // 40% chance single winner picked from item pool
        const winnerIndex = Math.floor(Math.random() * this.items.length);
        const winningItem = this.items[winnerIndex];

        // Outcomes for reels [reel0, reel1, reel2]
        // If items are participants/prizes, all reels lock on the same winner for a massive Jackpot feel!
        const reelWinningIndices = [winnerIndex, winnerIndex, winnerIndex];

        const itemHeight = 100; // matching CSS .slot-item height
        const totalItemsInCycle = this.items.length;
        const cycleHeight = totalItemsInCycle * itemHeight;

        let baseDuration = 3000;
        if (durationSetting === 'fast') baseDuration = 2000;
        if (durationSetting === 'suspense') baseDuration = 5500;

        for (let r = 0; r < 3; r++) {
            const reelEl = document.getElementById(`reel-${r}`);
            if (!reelEl) continue;
            const strip = reelEl.querySelector('.slot-strip');
            if (!strip) continue;

            // Target landing position on the 4th cycle
            const landingOffset = (4 * cycleHeight) + (reelWinningIndices[r] * itemHeight);
            const reelDuration = baseDuration + (r * 750); // Stagger reel stops

            strip.style.transition = 'none';
            strip.style.transform = 'translateY(0px)';

            // Trigger reflow
            void strip.offsetHeight;

            // Add spinning blur class
            reelEl.classList.add('spinning');

            // Apply smooth cubic-bezier deceleration
            strip.style.transition = `transform ${reelDuration}ms cubic-bezier(0.12, 0.8, 0.22, 1)`;
            strip.style.transform = `translateY(-${landingOffset}px)`;

            // Sound ticks during spin
            const tickInterval = setInterval(() => {
                if (window.soundEngine && Math.random() > 0.4) {
                    window.soundEngine.playTick(1.2 + (r * 0.2));
                }
            }, 90);

            setTimeout(() => {
                clearInterval(tickInterval);
                reelEl.classList.remove('spinning');
                reelEl.classList.add('locked');
                setTimeout(() => reelEl.classList.remove('locked'), 400);

                if (window.soundEngine) {
                    window.soundEngine.playReelStop(r);
                }

                // If last reel finished
                if (r === 2) {
                    this.isSpinning = false;
                    if (this.onFinishCallback) {
                        this.onFinishCallback(winningItem);
                    }
                }
            }, reelDuration);
        }

        return true;
    }
}

window.slotMachineEngine = new SlotMachineEngine();
