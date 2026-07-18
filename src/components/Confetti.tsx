import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
}

export default function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Resize canvas to parent bounds instead of window bounds
    const resizeCanvas = () => {
      if (canvas && parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    // Resize immediately and observe parent resizing
    resizeCanvas();
    
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(parent);

    // Particle types
    type ParticleType = 'confetti' | 'balloon' | 'cracker';

    // Particle Class representing Confetti, Balloons, and Crackers/Fireworks
    class Particle {
      type: ParticleType;
      x: number;
      y: number;
      size: number;
      color: string;
      
      // Physics properties
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      
      // Balloon specific properties
      stringLength: number;
      swayRange: number;
      swaySpeed: number;
      swayOffset: number;
      
      // Cracker specific properties
      life: number;
      maxLife: number;
      gravity: number;

      constructor(type: ParticleType, startX?: number, startY?: number) {
        const colors = [
          '#0D9488', // VoltMart Teal
          '#F97316', // Neon Orange
          '#10B981', // Success Emerald
          '#3B82F6', // Corporate Blue
          '#EC4899', // Hot Pink
          '#FBBF24', // Warm Amber
          '#A855F7', // Royal Purple
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.type = type;

        const w = canvas?.width || 800;
        const h = canvas?.height || 600;

        if (type === 'confetti') {
          // Standard falling square
          this.x = Math.random() * w;
          this.y = Math.random() * -h - 20;
          this.size = Math.random() * 8 + 6;
          this.speedX = Math.random() * 4 - 2;
          this.speedY = Math.random() * 4 + 3;
          this.rotation = Math.random() * 360;
          this.rotationSpeed = Math.random() * 3 - 1.5;
          this.stringLength = 0;
          this.swayRange = 0;
          this.swaySpeed = 0;
          this.swayOffset = 0;
          this.life = 1;
          this.maxLife = 1;
          this.gravity = 0;
        } else if (type === 'balloon') {
          // Rising balloon from the bottom
          this.x = Math.random() * w;
          this.y = h + Math.random() * 200 + 50;
          this.size = Math.random() * 15 + 15; // larger balloon size
          this.speedX = 0;
          this.speedY = -(Math.random() * 1.5 + 1.2); // rises up
          this.rotation = Math.random() * 20 - 10;
          this.rotationSpeed = 0;
          this.stringLength = Math.random() * 15 + 25;
          this.swayRange = Math.random() * 20 + 10;
          this.swaySpeed = Math.random() * 0.02 + 0.01;
          this.swayOffset = Math.random() * Math.PI * 2;
          this.life = 1;
          this.maxLife = 1;
          this.gravity = 0;
        } else {
          // Cracker/Firework spark exploding outwards
          this.x = startX ?? (w / 2);
          this.y = startY ?? (h / 3);
          this.size = Math.random() * 4 + 2;
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 6 + 2;
          this.speedX = Math.cos(angle) * speed;
          this.speedY = Math.sin(angle) * speed;
          this.rotation = 0;
          this.rotationSpeed = 0;
          this.stringLength = 0;
          this.swayRange = 0;
          this.swaySpeed = 0;
          this.swayOffset = 0;
          this.maxLife = Math.random() * 40 + 30;
          this.life = this.maxLife;
          this.gravity = 0.12; // slow fall for sparks
        }
      }

      update() {
        const w = canvas?.width || 800;
        const h = canvas?.height || 600;

        if (this.type === 'confetti') {
          this.x += this.speedX;
          this.y += this.speedY;
          this.rotation += this.rotationSpeed;

          // Recycle falling confetti
          if (this.y > h) {
            this.y = -20;
            this.x = Math.random() * w;
          }
        } else if (this.type === 'balloon') {
          this.y += this.speedY;
          this.swayOffset += this.swaySpeed;
          this.x += Math.sin(this.swayOffset) * 0.5; // gentle sway left & right

          // Reset balloon when floating off-screen
          if (this.y < -100) {
            this.y = h + Math.random() * 150 + 50;
            this.x = Math.random() * w;
          }
        } else if (this.type === 'cracker') {
          this.x += this.speedX;
          this.y += this.speedY;
          this.speedY += this.gravity; // apply gravity to fireworks sparks
          this.life--;
        }
      }

      draw() {
        if (!ctx) return;

        if (this.type === 'confetti') {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate((this.rotation * Math.PI) / 180);
          ctx.fillStyle = this.color;
          ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
          ctx.restore();
        } else if (this.type === 'balloon') {
          ctx.save();
          ctx.translate(this.x, this.y);
          
          // Draw balloon string
          ctx.beginPath();
          ctx.moveTo(0, this.size);
          ctx.bezierCurveTo(
            Math.sin(this.swayOffset) * 10, this.size + this.stringLength / 2,
            -Math.sin(this.swayOffset) * 10, this.size + this.stringLength * 0.75,
            0, this.size + this.stringLength
          );
          ctx.strokeStyle = '#D4D4D8'; // light zinc string
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw balloon body (egg-shaped oval)
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size * 0.75, this.size, 0, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();

          // Balloon tie triangle at bottom
          ctx.beginPath();
          ctx.moveTo(0, this.size - 2);
          ctx.lineTo(-4, this.size + 4);
          ctx.lineTo(4, this.size + 4);
          ctx.closePath();
          ctx.fillStyle = this.color;
          ctx.fill();

          // Highlight glare for shiny 3D look
          ctx.beginPath();
          ctx.ellipse(-this.size * 0.25, -this.size * 0.4, this.size * 0.15, this.size * 0.25, Math.PI / 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fill();

          ctx.restore();
        } else if (this.type === 'cracker' && this.life > 0) {
          ctx.save();
          const opacity = this.life / this.maxLife;
          ctx.globalAlpha = opacity;
          ctx.fillStyle = this.color;
          
          // Glowing star or spark
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Spawn 80 confetti and 12 floating balloons
    const particles: Particle[] = [];
    
    // Add initial confetti
    for (let i = 0; i < 70; i++) {
      particles.push(new Particle('confetti'));
    }
    
    // Add initial balloons
    for (let i = 0; i < 10; i++) {
      particles.push(new Particle('balloon'));
    }

    // Keep track of active crackers/fireworks sparks
    let crackerSparks: Particle[] = [];

    // Trigger fireworks/crackers explosions at regular intervals
    let lastCrackerTime = 0;
    const triggerCrackerExplosion = (time: number) => {
      if (time - lastCrackerTime > 1200) { // burst every 1.2s
        const w = canvas.width;
        const h = canvas.height;
        // Explode at 2 random locations on customer panel
        const burstX = Math.random() * (w - 100) + 50;
        const burstY = Math.random() * (h * 0.6) + h * 0.15;
        
        for (let j = 0; j < 35; j++) {
          crackerSparks.push(new Particle('cracker', burstX, burstY));
        }
        lastCrackerTime = time;
      }
    };

    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Trigger random firework crackers
      triggerCrackerExplosion(timestamp);

      // Render standard particles (confetti + balloons)
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Filter, update and render active cracker sparks
      crackerSparks = crackerSparks.filter((s) => s.life > 0);
      crackerSparks.forEach((s) => {
        s.update();
        s.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      id="confetti-canvas"
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50 w-full h-full overflow-hidden rounded-l-xl"
    />
  );
}
