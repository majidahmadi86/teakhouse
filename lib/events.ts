/**
 * v12 · Special events · client shape + DB mappers, rooms bilingual pattern.
 */

export type HotelEvent = {
  id: string;
  title: { en: string; th: string };
  /** ISO yyyy-mm-dd */
  date: string;
  description: { en: string; th: string };
  image: string;
  published: boolean;
};

export type DbHotelEvent = {
  id: string;
  titleEn: string;
  titleTh: string;
  date: string;
  descriptionEn: string;
  descriptionTh: string;
  image: string;
  published: boolean;
};

export function hotelEventToClient(e: DbHotelEvent): HotelEvent {
  return {
    id: e.id,
    title: { en: e.titleEn, th: e.titleTh },
    date: e.date,
    description: { en: e.descriptionEn, th: e.descriptionTh },
    image: e.image,
    published: e.published,
  };
}

export function hotelEventToDb(e: HotelEvent) {
  return {
    titleEn: e.title.en,
    titleTh: e.title.th,
    date: e.date,
    descriptionEn: e.description.en,
    descriptionTh: e.description.th,
    image: e.image,
    published: e.published,
  };
}
