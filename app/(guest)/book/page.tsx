import { Suspense } from "react";
import BookPageClient from "./BookPageClient";

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <section className="px-6 pb-16 pt-28">
          <div className="mx-auto max-w-[760px] animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-line" />
            <div className="h-12 w-full rounded bg-line" />
            <div className="h-64 rounded-[14px] bg-line" />
          </div>
        </section>
      }
    >
      <BookPageClient />
    </Suspense>
  );
}
