type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
}: Props) {
  const isDark = tone === "dark";
  return (
    <div
      className={[
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      ].join(" ")}
    >
      {eyebrow && (
        <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
          <span className="h-px w-6 bg-brand-500" />
          {eyebrow}
        </span>
      )}
      <h2
        className={[
          "font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl",
          isDark ? "text-white" : "text-ink-900",
        ].join(" ")}
      >
        {title}
      </h2>
      {description && (
        <p
          className={[
            "mt-4 text-base leading-relaxed sm:text-lg",
            isDark ? "text-ink-300" : "text-ink-500",
          ].join(" ")}
        >
          {description}
        </p>
      )}
    </div>
  );
}
