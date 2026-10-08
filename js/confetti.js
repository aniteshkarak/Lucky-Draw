/**
 * High Performance Confetti & Particle Engine
 */
class ConfettiEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.colors = [
            '#FF2E63', '#00F0FF', '#FFB800', '#00F5A0', 
            '#FF6B6B', '#4D96FF', '#9B51E0', '#FFE600', '#FF7597'
        ];
    }

    init(canvasId = 'confetti-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle(x, y, isBurst = false) {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const shapeType = Math.random() > 0.4 ? 'rect' : (Math.random() > 0.5 ? 'circle' : 'star');
        
        let vx, vy;
        if (isBurst) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 14 + 6;
            vx = Math.cos(angle) * speed;
            vy = Math.sin(angle) * speed - 4; // slight upward bias
        } else {
            vx = (Math.random() - 0.5) * 4;
            vy = Math.random() * 3 + 2;
        }

        return {
            x: x !== undefined ? x : Math.random() * this.canvas.width,
            y: y !== undefined ? y : -20,
            vx: vx,
            vy: vy,
            size: Math.random() * 10 + 6,
            color: color,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 12,
            flip: Math.random() * 360,
            flipSpeed: Math.random() * 8 + 4,
            gravity: 0.28,
            friction: 0.985,
            opacity: 1,
            decay: Math.random() * 0.005 + 0.003,
            shape: shapeType
        };
    }

    burst(x, y, count = 120) {
        if (!this.canvas) this.init();
        const originX = x !== undefined ? x : this.canvas.width / 2;
        const originY = y !== undefined ? y : this.canvas.height / 2;

        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(originX, originY, true));
        }

        if (!this.animationId) {
            this.animate();
        }
    }

    shower(durationMs = 4000) {
        if (!this.canvas) this.init();
        const startTime = Date.now();

        const spawnInterval = setInterval(() => {
            if (Date.now() - startTime > durationMs) {
                clearInterval(spawnInterval);
                return;
            }
            for (let i = 0; i < 6; i++) {
                this.particles.push(this.createParticle(Math.random() * this.canvas.width, -10, false));
            }
            if (!this.animationId) this.animate();
        }, 50);

        if (!this.animationId) {
            this.animate();
        }
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius, color, alpha) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;
        this.ctx.fill();
        this.ctx.restore();
    }

    animate() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;

            p.rotation += p.rotationSpeed;
            p.flip += p.flipSpeed;
            p.opacity -= p.decay;

            if (p.opacity <= 0 || p.y > this.canvas.height + 50) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.scale(Math.cos((p.flip * Math.PI) / 180), 1);
            this.ctx.globalAlpha = Math.max(0, p.opacity);

            if (p.shape === 'rect') {
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            } else if (p.shape === 'circle') {
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.shape === 'star') {
                this.drawStar(0, 0, 5, p.size, p.size / 2, p.color, p.opacity);
            }

            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.animationId = null;
        }
    }

    clear() {
        this.particles = [];
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

window.confettiEngine = new ConfettiEngine();
