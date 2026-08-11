import { HeroLCP } from "@/components/hero/HeroLCP";
import { hotelConfig } from "@/config/hotel.config";

const GRADIENT =
  "linear-gradient(105deg, #E8C87A 0%, #FF6B4A 100%)";

/**
 * Server-rendered home hero · zero client JS to paint LCP + copy.
 * English defaults (Thai overlay mounts only when lang=th).
 */
export function HomeHero({ searchSlot }: { searchSlot: React.ReactNode }) {
  const h1 = "The river keeps its own time.";
  const words = h1.split(" ");

  return (
    <section
      id="tkh-hero"
      className="relative z-[1] -mt-[calc(var(--demo-bar-h)+var(--header-h))] h-[100svh] overflow-hidden bg-navy md:h-[min(100svh,820px)]"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <HeroLCP />
        </div>
        <div id="tkh-hero-slideshow" className="absolute inset-0" />
        <div className="hero-scrim-mobile absolute inset-0 md:hidden" />
        <div className="hero-grade-mobile pointer-events-none absolute inset-0 md:hidden" />
        <div className="hero-scrim absolute inset-0 hidden md:block" />
      </div>

      <div className="tkh-hero-en absolute inset-0 flex flex-col md:hidden">
        <div className="hero-chrome-pad relative z-10 px-5">
          <p className="font-display text-[11px] font-normal uppercase tracking-[0.28em] text-gold hero-brand-glow">
            {hotelConfig.name}
          </p>
          <div className="mt-2">
            <h1 className="max-w-[15ch] font-display text-[2.35rem] leading-[1.12] text-white hero-text-shadow">
              {words.map((w, i) => {
                const bare = w.replace(/[.,]/g, "");
                const punct = w.slice(bare.length);
                const isAccent =
                  bare.toLowerCase().replace(/[.,]/g, "") === "river";
                return (
                  <span key={`${w}-${i}`} className="mr-[0.28em] inline-block">
                    {isAccent ? (
                      <span
                        className="bg-clip-text italic text-transparent [text-shadow:none]"
                        style={{
                          backgroundImage: GRADIENT,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          color: "transparent",
                        }}
                      >
                        {bare}
                      </span>
                    ) : (
                      bare
                    )}
                    {punct}
                  </span>
                );
              })}
            </h1>
          </div>
          <p className="mt-3 flex flex-wrap items-center justify-start gap-x-2 gap-y-1 text-[13px] font-semibold text-white/90">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-navy/70 px-3 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,.25)] backdrop-blur-md">
              <span className="tracking-[1px] text-gold" aria-hidden>
                ★★★★★
              </span>
              <span>5.0 · Google reviews</span>
            </span>
          </p>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        <div id="tkh-hero-actions" className="relative z-20 px-5 hero-actions-pb">
          <div className="hero-copy-panel">
            <p className="hero-lead-mobile text-white hero-text-shadow">
              Twelve teak rooms above the Chao Phraya.
            </p>
            <div className="relative z-20 mt-3 pt-1">{searchSlot}</div>
          </div>
        </div>
      </div>

      <div className="tkh-hero-en hero-chrome-pad absolute inset-0 hidden flex-col justify-end px-6 pb-10 md:flex">
        <div className="mx-auto w-full max-w-[1180px]">
          <p className="eyebrow mb-3 text-gold hero-text-shadow">
            Charoenkrung · Chao Phraya riverside
          </p>
          <h1 className="max-w-[16ch] font-display text-[clamp(2.7rem,5vw,4.3rem)] leading-[1.15] text-white hero-text-shadow">
            {words.map((w, i) => {
              const bare = w.replace(/[.,]/g, "");
              const punct = w.slice(bare.length);
              const isAccent =
                bare.toLowerCase().replace(/[.,]/g, "") === "river";
              return (
                <span key={`d-${w}-${i}`} className="mr-[0.28em] inline-block">
                  {isAccent ? (
                    <span
                      className="bg-clip-text italic text-transparent [text-shadow:none]"
                      style={{
                        backgroundImage: GRADIENT,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                      }}
                    >
                      {bare}
                    </span>
                  ) : (
                    bare
                  )}
                  {punct}
                </span>
              );
            })}
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white hero-text-shadow hero-copy-panel">
            Twelve teak rooms above the Chao Phraya. Book direct with us and
            always pay less than on any booking site.
          </p>
          <div className="relative z-20 mt-7">
            {searchSlot}
            <p className="hero-copy-panel mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-navy/70 px-3 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,.25)] backdrop-blur-md">
                <span className="tracking-[1px] text-gold" aria-hidden>
                  ★★★★★
                </span>
                <span>5.0 · Google reviews</span>
              </span>
              <span aria-hidden>·</span>
              <span>Best rate guaranteed</span>
              <span aria-hidden>·</span>
              <span>Free cancellation</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
