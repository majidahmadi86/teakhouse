/**
 * v12 · Dining menu · client shapes + DB mappers, same bilingual pattern as
 * rooms (flat *En/*Th columns in the DB, nested {en, th} on the client).
 */

export type DiningItem = {
  id: string;
  categoryId: string;
  name: { en: string; th: string };
  description: { en: string; th: string };
  price: number;
  order: number;
  published: boolean;
};

export type DiningCategory = {
  id: string;
  name: { en: string; th: string };
  order: number;
  published: boolean;
  items: DiningItem[];
};

export type DbDiningItem = {
  id: string;
  categoryId: string;
  nameEn: string;
  nameTh: string;
  descriptionEn: string;
  descriptionTh: string;
  price: number;
  order: number;
  published: boolean;
};

export type DbDiningCategory = {
  id: string;
  nameEn: string;
  nameTh: string;
  order: number;
  published: boolean;
  items?: DbDiningItem[];
};

export function diningItemToClient(i: DbDiningItem): DiningItem {
  return {
    id: i.id,
    categoryId: i.categoryId,
    name: { en: i.nameEn, th: i.nameTh },
    description: { en: i.descriptionEn, th: i.descriptionTh },
    price: i.price,
    order: i.order,
    published: i.published,
  };
}

export function diningItemToDb(i: DiningItem) {
  return {
    categoryId: i.categoryId,
    nameEn: i.name.en,
    nameTh: i.name.th,
    descriptionEn: i.description.en,
    descriptionTh: i.description.th,
    price: i.price,
    order: i.order,
    published: i.published,
  };
}

export function diningCategoryToClient(c: DbDiningCategory): DiningCategory {
  return {
    id: c.id,
    name: { en: c.nameEn, th: c.nameTh },
    order: c.order,
    published: c.published,
    items: (c.items ?? []).map(diningItemToClient),
  };
}

export function diningCategoryToDb(c: Omit<DiningCategory, "items">) {
  return {
    nameEn: c.name.en,
    nameTh: c.name.th,
    order: c.order,
    published: c.published,
  };
}
