import { LogoMark } from "@/components/LogoMark";
import { ArtPicture } from "@/components/ArtPicture";
import { tr } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";

/**
 * Sign-in and sign-up · a calm photograph beside the form (a banner on
 * phones). Server HTML; the form column is the AuthShell island.
 */
export function AuthFrame({ locale, children }: { locale: Lang; children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100svh-var(--header-h)-var(--demo-bar-h))] bg-stone md:grid md:grid-cols-[45fr_55fr]">
      <div className="relative h-[220px] overflow-hidden bg-ivory md:h-auto md:min-h-full">
        {/* Phones get the 16:9 banner crop, wider screens the 3:4 portrait. */}
        <ArtPicture
          id="hero-account"
          phoneId="hero-account-m"
          alt={tr(locale, {
            en: "A tall gabled window full of bamboo green beside a rattan hanging chair",
            th: "หน้าต่างหน้าจั่วบานสูงที่เต็มไปด้วยสีเขียวของไผ่ ข้างเก้าอี้หวายแขวน",
          })}
          sizes="45vw"
          phoneSizes="100vw"
          priority
        />
        <div className="hero-veil-bottom absolute inset-x-0 bottom-0 h-1/2" aria-hidden />
        <div className="absolute bottom-6 start-6 md:bottom-10 md:start-10">
          <LogoMark light showTag={false} size={22} />
        </div>
      </div>
      {children}
    </div>
  );
}
