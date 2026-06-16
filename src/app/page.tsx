"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Número en formato internacional de WhatsApp (Argentina: 54 + 9 + área + número)
const WHATSAPP_NUMBER = "5492616175453";
const WHATSAPP_MESSAGE =
  "Sii Mate obvio que quiero ir a comer sushi con vos, la verdad que te re extrañé";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

// Tamaño fijo del botón "No" (px) — así el texto puede cambiar sin que cambie de tamaño
const BTN_W = 128;
const BTN_H = 48;

// Parámetros del "imán" que repele el botón a nivel página
const RADIUS = 90; // radio (px) dentro del cual el cursor lo empuja
const PUSH = 8; // fuerza de repulsión
const DAMP = 0.88; // fricción (0-1): más alto = se desliza más lejos

const TEASES = [
  "NO",
  "Dale negra",
  "Daaaa",
  "Acordate que te ayude con las entradas",
  "Villera",
  "Pancha",
  "Emo",
  "Sucia",
  "Enana",
];

// Ilustración estilo Pompompurin (perrito amarillo con boina marrón)
function Pompompurin({
  className,
  size = 140,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Pompompurin"
    >
      {/* orejas */}
      <ellipse
        cx="44"
        cy="118"
        rx="27"
        ry="36"
        fill="#EAC868"
        transform="rotate(-16 44 118)"
      />
      <ellipse
        cx="156"
        cy="118"
        rx="27"
        ry="36"
        fill="#EAC868"
        transform="rotate(16 156 118)"
      />
      {/* cabeza */}
      <ellipse cx="100" cy="112" rx="68" ry="60" fill="#FBE08A" />
      {/* boina */}
      <ellipse cx="116" cy="62" rx="46" ry="21" fill="#8A5A2B" />
      <ellipse cx="116" cy="58" rx="46" ry="16" fill="#9C672F" />
      <circle cx="116" cy="44" r="7.5" fill="#7A4E26" />
      {/* mejillas */}
      <circle cx="64" cy="128" r="9" fill="#F4A98C" opacity="0.55" />
      <circle cx="136" cy="128" r="9" fill="#F4A98C" opacity="0.55" />
      {/* ojos */}
      <ellipse cx="80" cy="110" rx="6" ry="8.5" fill="#4A3320" />
      <ellipse cx="120" cy="110" rx="6" ry="8.5" fill="#4A3320" />
      <circle cx="82" cy="107" r="1.8" fill="#fff" />
      <circle cx="122" cy="107" r="1.8" fill="#fff" />
      {/* nariz */}
      <ellipse cx="100" cy="126" rx="5" ry="3.6" fill="#5A3D24" />
      {/* boca */}
      <path
        d="M100 130 q -11 11 -19 4"
        stroke="#5A3D24"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M100 130 q 11 11 19 4"
        stroke="#5A3D24"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  const noRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const offset = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const activatedRef = useRef(false);

  const [home, setHome] = useState<{ x: number; y: number } | null>(null);
  const [render, setRender] = useState({ x: 0, y: 0 });
  const [activated, setActivated] = useState(false);
  const [tease, setTease] = useState(0);

  // Posición inicial: anclada al hueco que queda al lado del botón "Sí"
  useEffect(() => {
    function place() {
      const a = anchorRef.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      setHome({ x: r.left, y: r.top });
    }
    place();
    // Reubicar al redimensionar solo si todavía no se activó
    function onResize() {
      if (!activatedRef.current) place();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Seguimiento del cursor en toda la página
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      mouse.current = { x: e.clientX, y: e.clientY };
    }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      if (t) mouse.current = { x: t.clientX, y: t.clientY };
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // Bucle de física del imán (solo repele una vez activado)
  useEffect(() => {
    let raf = 0;
    function tick() {
      const btn = noRef.current;
      if (btn && activatedRef.current) {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - mouse.current.x;
        const dy = cy - mouse.current.y;
        const dist = Math.hypot(dx, dy) || 0.001;

        let fx = 0;
        let fy = 0;

        // Repulsión: más fuerte cuanto más cerca está el cursor.
        // No vuelve a su lugar: se queda donde cae y recorre toda la página.
        if (dist < RADIUS) {
          const strength = (RADIUS - dist) / RADIUS; // 0..1
          fx += (dx / dist) * strength * PUSH;
          fy += (dy / dist) * strength * PUSH;
        }

        // Integración con fricción
        vel.current.x = (vel.current.x + fx) * DAMP;
        vel.current.y = (vel.current.y + fy) * DAMP;
        offset.current.x += vel.current.x;
        offset.current.y += vel.current.y;

        // Mantenerlo dentro de la pantalla
        const homeLeft = r.left - offset.current.x;
        const homeTop = r.top - offset.current.y;
        const margin = 12;
        const minX = margin - homeLeft;
        const maxX = window.innerWidth - r.width - margin - homeLeft;
        const minY = margin - homeTop;
        const maxY = window.innerHeight - r.height - margin - homeTop;
        offset.current.x = Math.min(Math.max(offset.current.x, minX), maxX);
        offset.current.y = Math.min(Math.max(offset.current.y, minY), maxY);

        setRender({ x: offset.current.x, y: offset.current.y });
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cambiar el texto cada 2 segundos desde que se activó (acercaste el mouse)
  useEffect(() => {
    if (!activated) return;
    const id = setInterval(() => setTease((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, [activated]);

  function activate() {
    if (!activatedRef.current) {
      activatedRef.current = true;
      setActivated(true);
    }
  }

  const noLabel = TEASES[tease % TEASES.length];

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 p-6">
      {/* Decoración de fondo con Pompompurin */}
      <Image
        src="/pompompurin.png"
        alt="Pompompurin"
        width={180}
        height={180}
        className="pointer-events-none absolute -left-10 -top-6 rotate-[-12deg] opacity-30"
      />
      <Pompompurin
        size={150}
        className="pointer-events-none absolute -bottom-8 -right-6 rotate-[14deg] opacity-30"
      />
      {/* Carnalito Wingman (Gekko) de Valorant, arriba a la derecha */}
      <Image
        src="/gekko.gif"
        alt="Wingman (Gekko) de Valorant"
        width={140}
        height={140}
        unoptimized
        className="pointer-events-none absolute right-4 top-4 z-20 rotate-[8deg] drop-shadow-lg"
      />
      {/* Dante (Devil May Cry) abajo a la derecha */}
      <Image
        src="/dante.gif"
        alt="Dante - Devil May Cry"
        width={150}
        height={150}
        unoptimized
        className="pointer-events-none absolute bottom-4 right-4 z-20 drop-shadow-lg"
      />

      {/* Modal central (solo la pregunta y el "Sí") */}
      <div className="z-10 w-full max-w-md rounded-3xl bg-white/90 p-8 text-center shadow-2xl ring-2 ring-amber-200/70 backdrop-blur sm:p-10">
        <div className="flex justify-center">
          <Image
            src="/pompompurin.png"
            alt="Pompompurin"
            width={150}
            height={150}
            priority
            className="drop-shadow-sm"
          />
        </div>
        <h1 className="mt-4 text-2xl font-bold leading-snug text-amber-900 sm:text-3xl">
          ¿Querés ir a comer sushi conmigo para el día del sushi?
        </h1>

        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-lg font-bold text-amber-950 shadow-lg shadow-amber-400/40 transition-transform hover:scale-105 hover:bg-amber-500 active:scale-95"
          >
            Sí
            <Pompompurin size={30} className="drop-shadow-sm" />
          </a>
          {/* Hueco que reserva el lugar del "No" al lado del "Sí" y ancla su posición */}
          <div
            ref={anchorRef}
            aria-hidden
            style={{ width: BTN_W, height: BTN_H }}
          />
        </div>

        <p className="mt-8 text-sm font-medium text-amber-700">De Mate</p>
      </div>

      {/* Botón "No" a nivel página: quieto hasta que el mouse esté totalmente encima */}
      {home && (
        <button
          ref={noRef}
          type="button"
          onMouseEnter={activate}
          onTouchStart={(e) => {
            e.preventDefault();
            activate();
          }}
          style={{
            left: home.x,
            top: home.y,
            minWidth: BTN_W,
            transform: `translate(${render.x}px, ${render.y}px)`,
            willChange: "transform",
          }}
          className="fixed z-20 flex items-center justify-center whitespace-nowrap rounded-full border-2 border-amber-300 bg-white px-6 py-3 text-lg font-bold text-amber-800 shadow-md"
        >
          {noLabel}
        </button>
      )}
    </main>
  );
}
