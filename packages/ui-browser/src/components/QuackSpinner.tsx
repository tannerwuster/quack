import { cn } from "@/lib/utils";

/**
 * Theme-aware loading scene. The full duck flies above a segmented progress
 * track; the Duck Hunt theme swaps in a short hit-and-retrieve easter egg.
 * Keep the label undefined when a parent status region describes the state.
 */
export const QuackSpinner = ({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) => (
  <div
    className={cn("quack-spinner", className)}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    <div className="quack-loader__stage" aria-hidden>
      <div className="quack-loader__flyer">
        <img
          className="quack-loader__flyer-frame quack-loader__flyer-frame--up"
          src="/duckhunt-flying-duck.png"
          alt=""
        />
        <img
          className="quack-loader__flyer-frame quack-loader__flyer-frame--down"
          src="/duckhunt-flying-duck-down.png"
          alt=""
        />
      </div>

      <div className="quack-loader__hit">
        <i /><i /><i /><i /><i />
      </div>

      <img
        className="quack-loader__retriever"
        src="/duckhunt-retriever.png"
        alt=""
      />
    </div>

    <div className="quack-loader__track" aria-hidden>
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  </div>
);
