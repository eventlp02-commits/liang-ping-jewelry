"use client";

import { useId, useLayoutEffect, useRef, type CSSProperties } from "react";
import type { Piece } from "./content.mjs";
import { pullMaterialPlate, type Pigments } from "./materialPlate";
import styles from "./MaterialStudy.module.css";

type Point = readonly [number, number];
type Study = {
  number: string;
  subject: Point;
  macro: Point;
  zoom: number;
  inks: Pigments;
  note: string;
  alt: string;
  lightGround?: boolean;
};

// Coordinates are registered on the uncropped originals, not on the viewport.
const studies: Record<string, Study> = {
  lacune: {
    number: "01", subject: [0.49, 0.46], macro: [0.49, 0.50], zoom: 1.85,
    inks: [[40, 47, 48], [150, 158, 153], [248, 245, 231]],
    note: "Ligne creuse", alt: "一枚不规则的银戒指，落在盛着乳白色液体的银勺里。",
  },
  liaison: {
    number: "02", subject: [0.47, 0.51], macro: [0.29, 0.51], zoom: 2.05,
    inks: [[47, 47, 57], [161, 154, 151], [249, 246, 233]],
    note: "Points de liaison", alt: "银链与一列珍珠垂落在贴着银灰色胶带的白色纸面上。",
    lightGround: true,
  },
  galop: {
    number: "03", subject: [0.53, 0.48], macro: [0.53, 0.48], zoom: 2.44,
    inks: [[67, 35, 32], [184, 109, 86], [249, 237, 213]],
    note: "Argent en relief", alt: "银色小马吊坠垂在巧克力和锡箔纸上，背景是浓烈的红色。",
  },
  signal: {
    number: "04", subject: [0.56, 0.40], macro: [0.56, 0.39], zoom: 2.46,
    inks: [[46, 53, 47], [141, 151, 115], [242, 240, 218]],
    note: "Lignes de force", alt: "一只戴着棕色手套与银戒指的手握着老式电话听筒。",
  },
  pulse: {
    number: "05", subject: [0.50, 0.66], macro: [0.51, 0.66], zoom: 2.12,
    inks: [[61, 40, 46], [169, 123, 121], [248, 237, 221]],
    note: "Trois fréquences", alt: "三道镶石手链绕在白色有线鼠标上，衬着暗红色桌面。",
  },
};

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const step = (a: number, b: number, n: number) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const score = [
  { at: 0, roman: "I", name: "Photographie", label: "原作摄影" },
  { at: 0.51, roman: "II", name: "Étude", label: "纸上习作" },
  { at: 0.96, roman: "III", name: "Détail", label: "局部与作品手记" },
];
const staticQuery = "(prefers-reduced-motion: reduce), (max-height: 460px)";

export function MaterialStudy({ piece }: { piece: Piece }) {
  return <StudyOpening key={piece.id} piece={piece} />;
}

function StudyOpening({ piece }: { piece: Piece }) {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const nav = useRef<HTMLElement>(null);
  const titleId = useId();
  const study = studies[piece.id] ?? studies.lacune;

  useLayoutEffect(() => {
    const section = root.current, stage = pin.current, photo = image.current;
    const plate = canvas.current, controls = nav.current;
    if (!section || !stage || !photo || !plate || !controls) return;
    const preference = window.matchMedia(staticQuery);
    let disposeScene: (() => void) | undefined;

    const configure = () => {
      disposeScene?.();
      disposeScene = undefined;
      if (preference.matches) return;

      section.dataset.pinned = "";
      let frame = 0, currentPhase = -1, previous = -1;
      let w = stage.clientWidth, h = stage.clientHeight;
      let draw: ReturnType<typeof pullMaterialPlate> | null = null;
      const paintQueue = new MessageChannel();
      const redraw = () => {
        frame = 0;
        const distance = Math.max(1, section.offsetHeight - h);
        const p = clamp(-section.getBoundingClientRect().top / distance);
        if (p === previous) return;
        previous = p;
        const tight = w < 700 || w / h < 0.9;
        const studyIn = step(0.02, 0.53, p);
        const sweep = step(0.56, 0.90, p);
        const z = 1 + studyIn * (tight ? 0.23 : 0.13)
          + sweep * (study.zoom - 1 - (tight ? 0.23 : 0.13)) * (w / h > 2.3 ? 0.75 : 1);
        const ratio = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * z;
        if (photo.naturalWidth && photo.naturalHeight) {
          const pw = photo.naturalWidth * ratio, ph = photo.naturalHeight * ratio;
          const fx = mix(study.subject[0], study.macro[0], sweep);
          const fy = mix(study.subject[1], study.macro[1], sweep);
          const targetX = mix(tight ? 0.53 : 0.56, tight ? 0.54 : 0.71, sweep);
          const targetY = mix(tight ? 0.43 : 0.49, tight ? 0.36 : study === studies.pulse ? 0.38 : 0.46, sweep);
          const x = clamp(w * targetX - pw * fx, w - pw, 0);
          const y = clamp(h * targetY - ph * fy, h - ph, 0);
          // Keep both surfaces in exact register; only their common matrix moves.
          stage.style.setProperty("--camera", `matrix(${ratio},0,0,${ratio},${x},${y})`);
          stage.style.setProperty("--source-w", `${photo.naturalWidth}px`);
          stage.style.setProperty("--source-h", `${photo.naturalHeight}px`);
          stage.dataset.framed = "";
        }
        stage.style.setProperty("--enter-edge", `${mix(-15, 115, step(0.16, 0.44, p))}%`);
        stage.style.setProperty("--leave-edge", `${mix(-20, 115, step(0.59, 0.82, p))}%`);
        stage.style.setProperty("--title-alpha", `${1 - step(0.07, 0.23, p)}`);
        stage.style.setProperty("--proof-alpha", `${step(0.28, 0.44, p) * (1 - step(0.57, 0.69, p))}`);
        stage.style.setProperty("--words-alpha", `${step(0.70, 0.88, p)}`);
        stage.style.setProperty("--words-rise", `${mix(18, 0, step(0.70, 0.88, p))}px`);

        const phase = p < 0.29 ? 0 : p < 0.71 ? 1 : 2;
        if (phase !== currentPhase) {
          controls.querySelectorAll("button").forEach((button, i) => {
            if (i === phase) button.setAttribute("aria-current", "step");
            else button.removeAttribute("aria-current");
          });
          currentPhase = phase;
        }
      };
      const queue = () => { if (!frame) frame = requestAnimationFrame(redraw); };
      const measure = () => {
        w = stage.clientWidth;
        h = stage.clientHeight;
        previous = -1;
        queue();
      };
      const register = () => {
        // A view transition can suspend rAF while its new snapshot is captured.
        cancelAnimationFrame(frame);
        w = stage.clientWidth;
        h = stage.clientHeight;
        previous = -1;
        redraw();
      };
      paintQueue.port1.onmessage = () => {
        if (!draw) return;
        try {
          const stop = performance.now() + 5;
          do {
            const part = draw.next();
            if (part.done) {
              if (part.value) stage.dataset.printed = "";
              draw = null;
              return;
            }
          } while (performance.now() < stop);
          paintQueue.port2.postMessage(0);
        } catch {
          // A browser may deny pixel reads. Keep the original and camera intact.
          draw = null;
        }
      };
      const onLoad = () => {
        measure();
        if (!photo.naturalWidth || draw || stage.hasAttribute("data-printed")) return;
        draw = pullMaterialPlate(photo, plate, study.inks, study.subject, Number(study.number), w < 700 ? 1040 : 1370);
        paintQueue.port2.postMessage(0);
      };
      const observer = new ResizeObserver(measure);
      observer.observe(stage);
      stage.addEventListener("onde:register", register);
      window.addEventListener("scroll", queue, { passive: true });
      photo.addEventListener("load", onLoad);
      if (photo.complete && photo.naturalWidth) onLoad();
      measure();
      disposeScene = () => {
        observer.disconnect();
        stage.removeEventListener("onde:register", register);
        photo.removeEventListener("load", onLoad);
        window.removeEventListener("scroll", queue);
        cancelAnimationFrame(frame);
        paintQueue.port1.close();
        paintQueue.port2.close();
        draw?.return(false);
        draw = null;
        plate.width = plate.height = 0;
        delete stage.dataset.printed;
        delete stage.dataset.framed;
        delete section.dataset.pinned;
        stage.removeAttribute("style");
      };
    };
    configure();
    preference.addEventListener("change", configure);
    return () => {
      preference.removeEventListener("change", configure);
      disposeScene?.();
    };
  }, [study]);

  const jump = (at: number) => {
    const section = root.current, stage = pin.current;
    if (!section || !stage || !section.hasAttribute("data-pinned")) return;
    const top = window.scrollY + section.getBoundingClientRect().top;
    window.scrollTo({ top: top + at * (section.offsetHeight - stage.clientHeight), behavior: "smooth" });
  };
  const props = {
    "--focus": `${study.subject[0] * 100}% ${study.subject[1] * 100}%`,
    "--ground": piece.color,
    "--paper": `rgb(${study.inks[2].join(",")})`,
    "--mineral": `rgb(${study.inks[1].join(",")})`,
    "--carbon": `rgb(${study.inks[0].join(",")})`,
  } as CSSProperties;

  return (
    <section ref={root} className={styles.score} style={props} aria-labelledby={titleId}
      data-light={study.lightGround ? "" : undefined}>
      <div ref={pin} className={styles.stage} data-material-stage="">
        <div className={styles.picture}>
          {/* The same decoded local image is the accessible original and the print master. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.original} ref={image} src={piece.image} alt={study.alt}
            fetchPriority="high" decoding="async" />
          <div className={styles.print} aria-hidden="true">
            <canvas className={styles.plate} ref={canvas} />
          </div>
          <div className={styles.shade} aria-hidden="true" />
          <div className={styles.title}>
            <div className={styles.annotation}><i />Objet {study.number} / 05</div>
            <h1 id={titleId}>{piece.title}</h1>
            <p>{piece.subtitle}</p>
          </div>
          <div className={styles.proof} aria-hidden="true" lang="fr">
            <div className={styles.annotation}><i />Étude de matière</div>
            <p>{study.note}</p>
            <div className={styles.imprints}><i /><i /><i /><span>Pl. {study.number}</span></div>
          </div>
        </div>
        <div className={styles.words}>
          <div className={styles.annotation} lang="fr"><i />Détail <span>/</span> {piece.title}</div>
          <p className={styles.phrase}>{piece.description}</p>
          <p className={styles.detail}>{piece.detail}</p>
        </div>
        <nav ref={nav} className={styles.stations} aria-label={`${piece.subtitle}的三个视图`}>
          {score.map((point, index) => (
            <button key={point.roman} type="button" onClick={() => jump(point.at)}
              aria-label={`${point.roman} · ${point.label}`} title={point.label}
              aria-current={index === 0 ? "step" : undefined}>
              <span className={styles.tick} /><span className={styles.numeral}>{point.roman}</span>
              <span className={styles.stationName} lang="fr">{point.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
