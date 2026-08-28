import { useEffect, useRef, useState } from "react";
import { PixelDuck } from "./PixelDuck";

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
        title="Quack!"
      >
        <PixelDuck />
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
