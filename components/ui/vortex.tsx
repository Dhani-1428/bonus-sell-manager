"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";
import { motion } from "motion/react";

interface VortexProps {
  children?: any;
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
}

export const Vortex = (props: VortexProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef(null);
  const animationFrameId = useRef<number>();
  const noise3DRef = useRef<ReturnType<typeof createNoise3D> | null>(null);
  const particleCount = props.particleCount || 700;
  const particlePropCount = 9;
  const particlePropsLength = particleCount * particlePropCount;
  const rangeY = props.rangeY || 100;
  const baseTTL = 50;
  const rangeTTL = 150;
  const baseSpeed = props.baseSpeed || 0.0;
  const rangeSpeed = props.rangeSpeed || 1.5;
  const baseRadius = props.baseRadius || 1;
  const rangeRadius = props.rangeRadius || 2;
  const baseHue = props.baseHue || 220;
  const rangeHue = 100;
  const noiseSteps = 3;
  const xOff = 0.00125;
  const yOff = 0.00125;
  const zOff = 0.0005;
  const backgroundColor = props.backgroundColor || "#000000";
  const tickRef = useRef(0);
  const particlePropsRef = useRef<Float32Array>(new Float32Array(particlePropsLength));
  const centerRef = useRef<[number, number]>([0, 0]);

  const HALF_PI: number = 0.5 * Math.PI;
  const TAU: number = 2 * Math.PI;
  const TO_RAD: number = Math.PI / 180;
  const rand = (n: number): number => n * Math.random();
  const randRange = (n: number): number => n - rand(2 * n);
  const fadeInOut = (t: number, m: number): number => {
    let hm = 0.5 * m;
    return Math.abs(((t + hm) % m) - hm) / hm;
  };
  const lerp = (n1: number, n2: number, speed: number): number =>
    (1 - speed) * n1 + speed * n2;

  const setup = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      const ctx = canvas.getContext("2d");

      if (ctx) {
        resize(canvas, ctx);
        initParticles();
        draw(canvas, ctx);
      }
    }
  };

  const initParticles = () => {
    tickRef.current = 0;
    particlePropsRef.current = new Float32Array(particlePropsLength);

    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      initParticle(i);
    }
  };

  const initParticle = (i: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let x, y, vx, vy, life, ttl, speed, radius, hue;

    x = rand(canvas.width);
    y = centerRef.current[1] + randRange(rangeY);
    vx = 0;
    vy = 0;
    life = 0;
    ttl = baseTTL + rand(rangeTTL);
    speed = baseSpeed + rand(rangeSpeed);
    radius = baseRadius + rand(rangeRadius);
    hue = baseHue + rand(rangeHue);

    particlePropsRef.current.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  };

  const draw = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    if (!noise3DRef.current) return;
    
    tickRef.current++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only fill background if it's not transparent
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawParticles(ctx);
    renderGlow(canvas, ctx);
    renderToScreen(canvas, ctx);

    animationFrameId.current = window.requestAnimationFrame(() =>
      draw(canvas, ctx),
    );
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    if (!noise3DRef.current) return;
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      updateParticle(i, ctx);
    }
  };

  const updateParticle = (i: number, ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas || !noise3DRef.current) return;

    let i2 = 1 + i,
      i3 = 2 + i,
      i4 = 3 + i,
      i5 = 4 + i,
      i6 = 5 + i,
      i7 = 6 + i,
      i8 = 7 + i,
      i9 = 8 + i;
    let n, x, y, vx, vy, life, ttl, speed, x2, y2, radius, hue;

    x = particlePropsRef.current[i];
    y = particlePropsRef.current[i2];
    n = noise3DRef.current(x * xOff, y * yOff, tickRef.current * zOff) * noiseSteps * TAU;
    vx = lerp(particlePropsRef.current[i3], Math.cos(n), 0.5);
    vy = lerp(particlePropsRef.current[i4], Math.sin(n), 0.5);
    life = particlePropsRef.current[i5];
    ttl = particlePropsRef.current[i6];
    speed = particlePropsRef.current[i7];
    x2 = x + vx * speed;
    y2 = y + vy * speed;
    radius = particlePropsRef.current[i8];
    hue = particlePropsRef.current[i9];

    drawParticle(x, y, x2, y2, life, ttl, radius, hue, ctx);

    life++;

    particlePropsRef.current[i] = x2;
    particlePropsRef.current[i2] = y2;
    particlePropsRef.current[i3] = vx;
    particlePropsRef.current[i4] = vy;
    particlePropsRef.current[i5] = life;

    (checkBounds(x, y, canvas) || life > ttl) && initParticle(i);
  };

  const drawParticle = (
    x: number,
    y: number,
    x2: number,
    y2: number,
    life: number,
    ttl: number,
    radius: number,
    hue: number,
    ctx: CanvasRenderingContext2D,
  ) => {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = radius;
    ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };

  const checkBounds = (x: number, y: number, canvas: HTMLCanvasElement) => {
    return x > canvas.width || x < 0 || y > canvas.height || y < 0;
  };

  const resize = (
    canvas: HTMLCanvasElement,
    ctx?: CanvasRenderingContext2D,
  ) => {
    if (typeof window === "undefined") return;
    const { innerWidth, innerHeight } = window;

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    centerRef.current[0] = 0.5 * canvas.width;
    centerRef.current[1] = 0.5 * canvas.height;
  };

  const renderGlow = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => {
    ctx.save();
    ctx.filter = "blur(8px) brightness(200%)";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.filter = "blur(4px) brightness(200%)";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  };

  const renderToScreen = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      resize(canvas, ctx);
    }
  };

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === "undefined") return;
    
    // Initialize noise generator
    noise3DRef.current = createNoise3D();
    
    setup();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative h-full w-full", props.containerClassName)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={containerRef}
        className="absolute inset-0 z-0 flex h-full w-full items-center justify-center bg-transparent"
      >
        <canvas ref={canvasRef}></canvas>
      </motion.div>

      <div className={cn("relative z-10", props.className)}>
        {props.children}
      </div>
    </div>
  );
};
