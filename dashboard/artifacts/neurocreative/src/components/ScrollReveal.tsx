import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const RevealCtx = createContext(false);

function useOnScreen(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const { ref, visible } = useOnScreen(0.1);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <RevealCtx.Provider value={visible}>{children}</RevealCtx.Provider>
    </div>
  );
}

let boldCounter = 0;

export function Bold({ children }: { children: ReactNode }) {
  const sectionVisible = useContext(RevealCtx);
  const [id] = useState(() => `bold-${boldCounter++}`);
  const ref = useRef<HTMLElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!sectionVisible) return;
    const timeout = setTimeout(() => setAnimated(true), 700);
    return () => clearTimeout(timeout);
  }, [sectionVisible]);

  return (
    <strong
      ref={ref}
      id={id}
      className="relative inline-block font-semibold text-foreground"
      style={{
        backgroundImage: "linear-gradient(hsl(var(--primary)), hsl(var(--primary)))",
        backgroundSize: animated ? "100% 3px" : "0% 3px",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 88%",
        transition: "background-size 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
    >
      {children}
    </strong>
  );
}
