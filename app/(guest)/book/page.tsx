import { Suspense } from "react";
import BookPageClient from "./BookPageClient";
import { BookAboveFold } from "@/components/booking/BookAboveFold";

export default function BookPage() {
  return (
    <Suspense fallback={<BookAboveFold />}>
      <BookPageClient />
    </Suspense>
  );
}
