import { ChromeMark } from "@/components/site/PageMarks";

/** Signing in is a focused task · no footer and no phone Book bar. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChromeMark noBookBar flushMain noFooter />
      {children}
    </>
  );
}
