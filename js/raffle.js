/**
 * Mystery Box & Rapid Multi-Winner Raffle Engine
 */

class MysteryBoxEngine {
    constructor() {
        this.container = null;
        this.isDrawing = false;
        this.items = [];
        this.boxes = [];
        this.onFinishCallback = null;
    }

    init(containerId = 'mystery-box-grid') {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
    }

    setItems(items) {
        this.items = items || [];
        this.renderBoxes();
    }

    renderBoxes(count = 8) {
        if (!this.container) return;
        const numBoxes = Math.min(count, Math.max(6, this.items.length));
        this.boxes = [];

        let html = '';
        for (let i = 0; i < numBoxes; i++) {
            html += `
                <div class="mystery-box-card" data-index="${i}">
                    <div class="mystery-box-inner">
                        <div class="box-front">
                            <div class="box-badge">#${i + 1}</div>
                            <div class="box-ribbon"></div>
                            <div class="box-chest-icon">🎁</div>
                            <div class="box-question">?</div>
                            <div class="box-tap-label">TAP TO UNLOCK</div>
                        </div>
                        <div class="box-back">
                            <div class="box-prize-aura"></div>
                            <div class="box-prize-icon">🏆</div>
                            <div class="box-prize-name">PRIZE</div>
                            <div class="box-congrats-tag">WINNER!</div>
                        </div>
                    </div>
                </div>
            `;
        }

        this.container.innerHTML = html;

        // Add click events to boxes
        const boxCards = this.container.querySelectorAll('.mystery-box-card');
        boxCards.forEach(card => {
            card.addEventListener('click', () => {
                if (this.isDrawing || card.classList.contains('opened')) return;
                const idx = parseInt(card.dataset.index, 10);
                this.openBox(card, idx);
            });
        });
    }

    openBox(cardElement, boxIndex) {
        if (this.isDrawing || this.items.length === 0) return;
        this.isDrawing = true;

        if (window.soundEngine) window.soundEngine.playClick();
        cardElement.classList.add('shaking');

        // Choose random item
        const winner = this.items[Math.floor(Math.random() * this.items.length)];

        setTimeout(() => {
            cardElement.classList.remove('shaking');
            cardElement.classList.add('opened');

            // Populate the back of the card
            const iconEl = cardElement.querySelector('.box-prize-icon');
            const nameEl = cardElement.querySelector('.box-prize-name');
            if (iconEl) iconEl.textContent = winner.icon || '🎁';
            if (nameEl) nameEl.textContent = winner.text;

            if (window.soundEngine) {
                window.soundEngine.playBoxOpen();
            }

            setTimeout(() => {
                this.isDrawing = false;
                if (this.onFinishCallback) {
                    this.onFinishCallback(winner);
                }
            }, 800);
        }, 800);
    }

    pickRandomBox(onFinish) {
        if (this.isDrawing) return;
        this.onFinishCallback = onFinish;

        const unopened = Array.from(this.container.querySelectorAll('.mystery-box-card:not(.opened)'));
        if (unopened.length === 0) {
            // Reset all boxes if all were opened
            this.renderBoxes();
            setTimeout(() => this.pickRandomBox(onFinish), 300);
            return;
        }

        // Cycle hover highlight
        let cycleCount = 0;
        const totalCycles = 15;
        const interval = setInterval(() => {
            unopened.forEach(b => b.classList.remove('focused-box'));
            const randomPick = unopened[cycleCount % unopened.length];
            randomPick.classList.add('focused-box');
            if (window.soundEngine) window.soundEngine.playTick(1.4);

            cycleCount++;
            if (cycleCount >= totalCycles) {
                clearInterval(interval);
                const finalBox = unopened[Math.floor(Math.random() * unopened.length)];
                finalBox.classList.remove('focused-box');
                const idx = parseInt(finalBox.dataset.index, 10);
                this.openBox(finalBox, idx);
            }
        }, 100);
    }
}

class RapidDrawEngine {
    constructor() {
        this.container = null;
        this.isRolling = false;
        this.items = [];
        this.onFinishCallback = null;
    }

    init(containerId = 'rapid-draw-container') {
        this.container = document.getElementById(containerId);
    }

    setItems(items) {
        this.items = items || [];
    }

    startDraw(winnerCount = 3, onFinish) {
        if (this.isRolling || this.items.length === 0) return false;
        this.isRolling = true;
        this.onFinishCallback = onFinish;

        const count = Math.min(winnerCount, this.items.length);
        const displayScreen = document.getElementById('rapid-display-name');
        const countBadge = document.getElementById('rapid-countdown-badge');

        if (!displayScreen) return false;

        // Shuffle pool
        const shuffled = [...this.items].sort(() => Math.random() - 0.5);
        const selectedWinners = shuffled.slice(0, count);

        let iterations = 0;
        const maxIterations = 35;
        let speed = 50;

        const cycle = () => {
            const tempItem = this.items[Math.floor(Math.random() * this.items.length)];
            displayScreen.innerHTML = `
                <span class="rapid-live-icon">${tempItem.icon || '🎯'}</span>
                <span class="rapid-live-text">${tempItem.text}</span>
            `;

            if (window.soundEngine) window.soundEngine.playBeep(500 + (iterations * 15));

            iterations++;
            if (iterations < maxIterations) {
                speed += 6; // slow down gradually
                setTimeout(cycle, speed);
            } else {
                // Done! Reveal
                this.isRolling = false;
                displayScreen.innerHTML = `
                    <span class="rapid-live-icon">🏆</span>
                    <span class="rapid-live-text" style="color: #FFB800;">LOCKED IN!</span>
                `;

                if (this.onFinishCallback) {
                    this.onFinishCallback(selectedWinners);
                }
            }
        };

        cycle();
        return true;
    }
}

window.mysteryBoxEngine = new MysteryBoxEngine();
window.rapidDrawEngine = new RapidDrawEngine();
