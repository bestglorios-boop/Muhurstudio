/**
 * WebGL yoksa, JS kapalıysa veya sahne henüz hazır değilse devreye girer.
 * Aynı marka geometrisi, saf SVG: boş alan bırakılmaz, spinner gösterilmez.
 */
export function FallbackSeal() {
  return (
    <svg
      viewBox="0 0 600 600"
      className="h-full w-full"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Basınç konturları */}
      <g>
        {Array.from({ length: 16 }, (_, i) => {
          const r = 168 + i * 16;
          return (
            <ellipse
              key={i}
              cx="300"
              cy="300"
              rx={r}
              ry={r * 0.9}
              stroke="var(--on-ink)"
              strokeOpacity={0.055 - i * 0.0022}
              strokeWidth="1"
            />
          );
        })}
      </g>

      {/* Disk + halkalar */}
      <circle cx="300" cy="300" r="150" fill="#0B0B0B" />
      <circle cx="300" cy="300" r="150" stroke="#1D1D1D" strokeWidth="1" />
      <circle cx="300" cy="300" r="103" stroke="#1D1D1D" strokeWidth="1" />

      {/* Kabartma M */}
      <path
        d="M240 372V228h20l40 60 40-60h20v144h-21v-95l-39 58-39-58v95Z"
        fill="#141414"
        stroke="#232323"
        strokeWidth="1"
      />

      {/* Tek kırmızı detay */}
      <circle cx="300" cy="466" r="3" fill="var(--seal)" />
    </svg>
  );
}
