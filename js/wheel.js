/**
 * Canvas Fortune Wheel Engine with Physics, Sound & Glowing Pointer
 */
class WheelEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isSpinning = false;
        this.currentAngle = 0; // in radians
        this.angularVelocity = 0;
        this.lastTickAngle = 0;
        this.items = [];
        this.onFinishCallback = null;
        this.spinTimeout = null;
        this.animationFrame = null;
        this.pointerBounce = 0;
    }

    init(canvasId = 'wheel-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => {
            this.resize();
            this.draw();
        });
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(rect.width || 560, rect.height || 560);

        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.ctx.scale(dpr, dpr);
        this.displaySize = size;
    }

    setItems(items) {
        this.items = items || [];
        this.draw();
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const size = this.displaySize || 560;
        const cx = size / 2;
        const cy = size / 2;
        const radius = (size / 2) - 24;

        this.ctx.clearRect(0, 0, size, size);

        if (this.items.length === 0) {
            // Draw empty state
            this.drawEmptyState(cx, cy, radius);
            return;
        }

        const totalWeight = this.items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let startAngle = this.currentAngle;

        // Draw Outer Glowing Rim
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
        const rimGrad = this.ctx.createRadialGradient(cx, cy, radius, cx, cy, radius + 14);
        rimGrad.addColorStop(0, '#1E293B');
        rimGrad.addColorStop(0.6, '#0F172A');
        rimGrad.addColorStop(1, '#FFB800');
        this.ctx.fillStyle = rimGrad;
        this.ctx.shadowColor = 'rgba(255, 184, 0, 0.4)';
        this.ctx.shadowBlur = 18;
        this.ctx.fill();
        this.ctx.restore();

        // Outer Bulb Lights
        const bulbCount = Math.max(16, this.items.length * 2);
        for (let b = 0; b < bulbCount; b++) {
            const bAngle = (b * (Math.PI * 2 / bulbCount)) + this.currentAngle * 0.2;
            const bx = cx + Math.cos(bAngle) * (radius + 6);
            const by = cy + Math.sin(bAngle) * (radius + 6);

            this.ctx.beginPath();
            this.ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
            this.ctx.fillStyle = (b % 2 === 0) ? '#FFD700' : '#FFFFFF';
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 6;
            this.ctx.fill();
        }

        // Draw Slices
        this.items.forEach((item, index) => {
            const sliceAngle = ((item.weight || 1) / totalWeight) * (Math.PI * 2);
            const endAngle = startAngle + sliceAngle;

            // Draw Slice Arc
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.arc(cx, cy, radius, startAngle, endAngle);
            this.ctx.closePath();

            // Gradient for depth
            const sliceGrad = this.ctx.createRadialGradient(cx, cy, 20, cx, cy, radius);
            sliceGrad.addColorStop(0, this.lightenColor(item.color || '#4D96FF', 20));
            sliceGrad.addColorStop(1, item.color || '#4D96FF');
            this.ctx.fillStyle = sliceGrad;
            this.ctx.fill();

            // Slice Border Line
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.restore();

            // Outer Pin for Ticker
            const pinX = cx + Math.cos(startAngle) * (radius - 2);
            const pinY = cy + Math.sin(startAngle) * (radius - 2);
            this.ctx.beginPath();
            this.ctx.arc(pinX, pinY, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 4;
            this.ctx.fill();

            // Draw Text & Icon
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(startAngle + sliceAngle / 2);

            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';

            // Auto-scale font for long text
            const maxTextLength = Math.max(12, item.text.length);
            const fontSize = Math.max(11, Math.min(18, Math.floor(220 / maxTextLength)));
            this.ctx.font = `600 ${fontSize}px "Outfit", "Plus Jakarta Sans", sans-serif`;

            // White text with subtle drop shadow for readability
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            this.ctx.shadowBlur = 5;

            const textDist = radius - 28;
            let displayLabel = item.text;
            if (displayLabel.length > 20) {
                displayLabel = displayLabel.substring(0, 18) + '…';
            }

            const icon = item.icon ? `${item.icon} ` : '';
            this.ctx.fillText(`${icon}${displayLabel}`, textDist, 0);

            this.ctx.restore();

            startAngle = endAngle;
        });

        // Draw Center Hub
        this.drawCenterHub(cx, cy);

        // Draw Dynamic Pointer (at 3 o'clock / 0 radians)
        this.drawPointer(cx, cy, radius);
    }

    drawEmptyState(cx, cy, radius) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1E293B';
        this.ctx.fill();
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        this.ctx.fillStyle = '#94A3B8';
        this.ctx.font = '16px "Outfit", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Add items to spin the wheel!', cx, cy);
        this.ctx.restore();
    }

    drawCenterHub(cx, cy) {
        this.ctx.save();

        // Outer Ring
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 38, 0, Math.PI * 2);
        const hubGrad = this.ctx.createRadialGradient(cx, cy, 5, cx, cy, 38);
        hubGrad.addColorStop(0, '#FFFFFF');
        hubGrad.addColorStop(0.3, '#FFB800');
        hubGrad.addColorStop(1, '#B45309');
        this.ctx.fillStyle = hubGrad;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();

        // Inner Circle
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0F172A';
        this.ctx.fill();

        // Core Glowing Dot
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00F0FF';
        this.ctx.shadowColor = '#00F0FF';
        this.ctx.shadowBlur = 8;
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPointer(cx, cy, radius) {
        // Pointer is positioned at the top (12 o'clock / -PI/2)
        const pointerY = cy - radius - 2;
        const bounceOffset = this.pointerBounce * 4;

        this.ctx.save();
        this.ctx.translate(cx, pointerY);
        this.ctx.rotate((this.pointerBounce * 0.15));

        this.ctx.beginPath();
        this.ctx.moveTo(0, 22); // Tip pointing down into the wheel
        this.ctx.lineTo(-14, -14);
        this.ctx.lineTo(14, -14);
        this.ctx.closePath();

        const grad = this.ctx.createLinearGradient(-14, -14, 14, 22);
        grad.addColorStop(0, '#FFF500');
        grad.addColorStop(0.5, '#FFB800');
        grad.addColorStop(1, '#FF3366');

        this.ctx.fillStyle = grad;
        this.ctx.shadowColor = 'rgba(255, 46, 99, 0.6)';
        this.ctx.shadowBlur = 12;
        this.ctx.fill();

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Pointer cap
        this.ctx.beginPath();
        this.ctx.arc(0, -14, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();

        this.ctx.restore();
    }

    lightenColor(hex, percent) {
        let num = parseInt(hex.replace('#', ''), 16);
        let amt = Math.round(2.55 * percent);
        let R = (num >> 16) + amt;
        let B = ((num >> 8) & 0x00FF) + amt;
        let G = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
    }

    spin(durationSetting = 'normal', onFinish) {
        if (this.isSpinning || this.items.length === 0) return false;

        this.isSpinning = true;
        this.onFinishCallback = onFinish;

        // Choose random winner index based on weights
        const totalWeight = this.items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let randomWeight = Math.random() * totalWeight;
        let winningIndex = 0;
        let accumulatedWeight = 0;

        for (let i = 0; i < this.items.length; i++) {
            accumulatedWeight += (this.items[i].weight || 1);
            if (randomWeight <= accumulatedWeight) {
                winningIndex = i;
                break;
            }
        }

        // Duration mapping
        let durationMs = 5000;
        let minRounds = 6;
        if (durationSetting === 'fast') {
            durationMs = 3000;
            minRounds = 4;
        } else if (durationSetting === 'suspense') {
            durationMs = 8500;
            minRounds = 10;
        }

        // Pointer is at 12 o'clock (-PI/2).
        // Let's calculate the target angle so that winning slice lands at -PI/2
        const sliceAngle = (Math.PI * 2) / this.items.length;
        const targetSliceCenter = (winningIndex + 0.5) * sliceAngle;
        
        // Final angle modulo 2PI should align targetSliceCenter to pointer at -PI/2
        const pointerPos = (3 * Math.PI) / 2; // 12 o'clock in [0, 2PI)
        const targetRelativeAngle = pointerPos - targetSliceCenter;
        
        // Add random slight offset inside slice (not right at edge)
        const jitter = (Math.random() - 0.5) * (sliceAngle * 0.6);
        const finalTargetAngle = this.currentAngle + (minRounds * Math.PI * 2) + (targetRelativeAngle - (this.currentAngle % (Math.PI * 2))) + jitter;

        const startAngle = this.currentAngle;
        const distanceToSpin = finalTargetAngle - startAngle;
        const startTime = performance.now();
        this.lastTickAngle = startAngle;

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / durationMs);

            // Use quintic easing for ultra-smooth realistic friction
            const easedProgress = easeOutQuint(progress);
            this.currentAngle = startAngle + (distanceToSpin * easedProgress);

            // Calculate slice crossings for ticking sound
            const currentTotalSlicesCrossed = Math.floor((this.currentAngle / (Math.PI * 2)) * this.items.length);
            const lastTotalSlicesCrossed = Math.floor((this.lastTickAngle / (Math.PI * 2)) * this.items.length);

            if (currentTotalSlicesCrossed !== lastTotalSlicesCrossed) {
                this.pointerBounce = 1.0;
                if (window.soundEngine) {
                    const speedPitch = 0.8 + (1 - progress) * 0.4;
                    window.soundEngine.playTick(speedPitch);
                }
            } else {
                this.pointerBounce *= 0.85;
            }

            this.lastTickAngle = this.currentAngle;
            this.draw();

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                this.pointerBounce = 0;
                this.draw();
                
                const winner = this.items[winningIndex];
                if (this.onFinishCallback) {
                    this.onFinishCallback(winner);
                }
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
        return true;
    }
}

window.wheelEngine = new WheelEngine();
