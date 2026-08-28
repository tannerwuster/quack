import { useEffect, useRef, useState } from "react";

const playQuack = () => {
  const AudioContext = window.AudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(210, now);
  oscillator.frequency.exponentialRampToValueAtTime(95, now + 0.11);
  oscillator.frequency.setValueAtTime(170, now + 0.12);
  oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.24);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1_100, now);
  filter.Q.value = 5;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.14, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

  oscillator.connect(filter).connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.27);
  oscillator.addEventListener("ended", () => void context.close());
};

export const QuackLogo = () => {
  const [isQuacking, setIsQuacking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const quack = () => {
    clearTimeout(timer.current);
    setIsQuacking(false);
    requestAnimationFrame(() => setIsQuacking(true));
    playQuack();
    timer.current = setTimeout(() => setIsQuacking(false), 850);
  };

  return (
    <div className="quack-logo-wrap">
      <button
        type="button"
        className="quack-logo"
        onClick={quack}
        aria-label="Quack"
        aria-expanded={isQuacking}
      >
        <svg
          viewBox="0 0 64 64"
          role="img"
          aria-hidden="true"
          shapeRendering="crispEdges"
        >
          <path
            className="quack-logo__ink"
            d="M16 8h24v4h8v8h4v8h8v16H48v4h-4v12H16v-4h-4V44h4v-8h-4V16h4z"
          />
          <path
            className="quack-logo__head"
            d="M20 12h16v4h8v8h4v8h-8v8h-4v8h4v8H20v-4h-4v-8h4V36h-4V20h4z"
          />
          <path
            className="quack-logo__head-shadow"
            d="M16 28h4v12h4v4h-4v8h20v4H20v-4h-4V44h4v-8h-4z"
          />
          <path
            className="quack-logo__bill"
            d="M40 28h8v4h8v8H44v-4h-8v-4h4z"
          />
          <path className="quack-logo__eye" d="M32 20h8v8h-8z" />
        </svg>
      </button>
      <div
        className={`quack-bubble${isQuacking ? " quack-bubble--visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {isQuacking ? "QUACK" : ""}
      </div>
    </div>
  );
};
