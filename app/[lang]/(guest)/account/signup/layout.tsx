import { AuthFrame } from "@/components/AuthFrame";
import { ChromeMark } from "@/components/site/PageMarks";
import { pageLang, type LangParams } from "@/lib/pageLocale";

/** Signing in is a focused task · no footer and no phone Book bar. */
export default function AuthLayout({ children, params }: { children: React.ReactNode; params: LangParams }) {
  return (
    <>
      <ChromeMark noBookBar noStayBar flushMain noFooter />
      <AuthFrame locale={pageLang(params)}>{children}</AuthFrame>
    </>
  );
}
