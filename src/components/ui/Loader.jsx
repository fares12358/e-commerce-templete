export default function Loader({ size = 45, color = "#000" }) {
    const dots = Array.from({ length: 8 });
  
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {dots.map((_, i) => (
          <span
            key={i}
            className="absolute inset-0 flex items-start justify-center"
            style={{
              transform: `rotate(${i * 45}deg)`,
            }}
          >
            <span
              className="block rounded-full"
              style={{
                width: size * 0.2,
                height: size * 0.2,
                backgroundColor: color,
                animation: "dot-pulse 1s ease-in-out infinite",
                animationDelay: `${-1 + i * 0.125}s`,
                opacity: 0.5,
              }}
            />
          </span>
        ))}
      </div>
    );
  }
  