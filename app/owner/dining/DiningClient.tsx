"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ImageUploadField } from "@/components/owner/ImageUploadField";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";
import {
  ModalActions,
  OwnerFormField,
  OwnerModal,
  useConfirm,
  useToast,
} from "@/components/owner/OwnerUI";
import type { DiningCategory, DiningItem } from "@/lib/dining";
import { useI18n } from "@/lib/i18n";
import { ownerFetch } from "@/lib/ownerSessionClient";
import { cn, formatBaht } from "@/lib/utils";
import { ReservationsPanel } from "./ReservationsPanel";
import { invalidateCached, readCached } from "@/lib/ownerCache";

type CategoryForm = {
  name: { en: string; th: string };
  image: string;
  published: boolean;
};
type DishForm = {
  categoryId: string;
  name: { en: string; th: string };
  description: { en: string; th: string };
  price: number;
  image: string;
  published: boolean;
};

function emptyCategory(): CategoryForm {
  return { name: { en: "", th: "" }, image: "", published: true };
}

function emptyDish(categoryId: string): DishForm {
  return {
    categoryId,
    name: { en: "", th: "" },
    description: { en: "", th: "" },
    price: 200,
    image: "",
    published: true,
  };
}

// HF-1 · owner writes carry the owner session (lib/ownerSessionClient).
// v18 · never throws: a network failure is an unsuccessful write like any other.
async function jsonFetch(url: string, init?: RequestInit): Promise<boolean> {
  try {
    const res = await ownerFetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Dining manager · category + dish CRUD, DB-backed like rooms. The list is
 * small, so every mutation goes to the server first and the whole menu is
 * refetched · no optimistic bookkeeping to drift.
 */
export default function OwnerDiningPage() {
  const { t, tr } = useI18n();
  const toast = useToast();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<DiningCategory[] | null>(null);
  const [catBaseline, setCatBaseline] = useState("");
  const [dishBaseline, setDishBaseline] = useState("");
  const [catError, setCatError] = useState("");
  const [dishError, setDishError] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<DiningCategory | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCategory);

  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DiningItem | null>(null);
  const [dishForm, setDishForm] = useState<DishForm>(() => emptyDish(""));

  const refresh = useCallback(async (fresh = false) => {
    if (fresh) invalidateCached("/api/dining");
    try {
      await readCached<DiningCategory[]>("/api/dining", setCategories);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // An inline name error clears as soon as the name is filled in.
  const catNameEn = catForm.name.en;
  const dishNameEn = dishForm.name.en;
  useEffect(() => {
    if (catNameEn.trim() || dishNameEn.trim()) setNameError("");
  }, [catNameEn, dishNameEn]);

  function openCategory(cat: DiningCategory | null, form: CategoryForm) {
    setEditingCat(cat);
    setCatForm(form);
    setCatBaseline(JSON.stringify(form));
    setCatError("");
    setNameError("");
    setCatModalOpen(true);
  }

  function openAddCategory() {
    openCategory(null, emptyCategory());
  }

  function openEditCategory(cat: DiningCategory) {
    openCategory(cat, {
      name: { ...cat.name },
      image: cat.image,
      published: cat.published,
    });
  }

  async function saveCategory() {
    if (!catForm.name.en.trim()) {
      setNameError(t("ow.v.nameEn"));
      setCatError(t("ow.v.fix"));
      return;
    }
    setSaving(true);
    let ok: boolean;
    const name = {
      en: catForm.name.en.trim(),
      th: catForm.name.th.trim() || catForm.name.en.trim(),
    };
    if (editingCat) {
      ok = await jsonFetch(`/api/dining/categories/${editingCat.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          image: catForm.image,
          published: catForm.published,
        }),
      });
    } else {
      const order = categories?.length ?? 0;
      ok = await jsonFetch("/api/dining/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          image: catForm.image,
          order,
          published: catForm.published,
        }),
      });
    }
    setSaving(false);
    if (!ok) {
      setCatError(t("ow.ui.saveFailed"));
      return;
    }
    setCatBaseline(JSON.stringify(catForm));
    setCatModalOpen(false);
    toast(t("ow.ui.savedName", { name: name.en }));
    await refresh(true);
  }

  async function toggleCategoryPublished(cat: DiningCategory) {
    const ok = await jsonFetch(`/api/dining/categories/${cat.id}`, {
      method: "PATCH",
      body: JSON.stringify({ published: !cat.published }),
    });
    if (ok) toast(cat.published ? t("ow.ui.nowHidden", { name: tr(cat.name) }) : t("ow.ui.nowPublished", { name: tr(cat.name) }));
    else toast(t("ow.ui.saveFailed"), "error");
    await refresh(true);
  }

  async function deleteCategory(cat: DiningCategory) {
    const yes = await confirm({
      title: t("ow.dn.delCatTitle", { name: tr(cat.name) }),
      message: cat.items.length > 0 ? t("ow.dn.delCatBody", { n: cat.items.length }) : t("ow.ui.cannotUndo"),
      confirmLabel: t("ow.del"),
      tone: "danger",
    });
    if (!yes) return;
    const ok = await jsonFetch(`/api/dining/categories/${cat.id}`, { method: "DELETE" });
    if (ok) toast(t("ow.ui.deletedName", { name: tr(cat.name) }));
    else toast(t("ow.ui.deleteFailed"), "error");
    await refresh(true);
  }

  function openDish(dish: DiningItem | null, form: DishForm) {
    setEditingDish(dish);
    setDishForm(form);
    setDishBaseline(JSON.stringify(form));
    setDishError("");
    setNameError("");
    setDishModalOpen(true);
  }

  function openAddDish(cat: DiningCategory) {
    openDish(null, emptyDish(cat.id));
  }

  function openEditDish(dish: DiningItem) {
    openDish(dish, {
      categoryId: dish.categoryId,
      name: { ...dish.name },
      description: { ...dish.description },
      price: dish.price,
      image: dish.image,
      published: dish.published,
    });
  }

  async function saveDish() {
    if (!dishForm.name.en.trim() || !dishForm.categoryId) {
      setNameError(t("ow.v.nameEn"));
      setDishError(t("ow.v.fix"));
      return;
    }
    if (!(dishForm.price >= 0)) {
      setDishError(t("ow.v.price"));
      return;
    }
    setSaving(true);
    let ok: boolean;
    const payload = {
      categoryId: dishForm.categoryId,
      name: {
        en: dishForm.name.en.trim(),
        th: dishForm.name.th.trim() || dishForm.name.en.trim(),
      },
      description: {
        en: dishForm.description.en.trim(),
        th: dishForm.description.th.trim() || dishForm.description.en.trim(),
      },
      price: dishForm.price,
      image: dishForm.image,
      published: dishForm.published,
    };
    if (editingDish) {
      ok = await jsonFetch(`/api/dining/items/${editingDish.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      const cat = categories?.find((c) => c.id === dishForm.categoryId);
      const order = cat?.items.length ?? 0;
      ok = await jsonFetch("/api/dining/items", {
        method: "POST",
        body: JSON.stringify({ ...payload, order }),
      });
    }
    setSaving(false);
    if (!ok) {
      setDishError(t("ow.ui.saveFailed"));
      return;
    }
    setDishBaseline(JSON.stringify(dishForm));
    setDishModalOpen(false);
    toast(t("ow.ui.savedName", { name: payload.name.en }));
    await refresh(true);
  }

  async function toggleDishPublished(dish: DiningItem) {
    const ok = await jsonFetch(`/api/dining/items/${dish.id}`, {
      method: "PATCH",
      body: JSON.stringify({ published: !dish.published }),
    });
    if (ok) toast(dish.published ? t("ow.ui.nowHidden", { name: tr(dish.name) }) : t("ow.ui.nowPublished", { name: tr(dish.name) }));
    else toast(t("ow.ui.saveFailed"), "error");
    await refresh(true);
  }

  async function deleteDish(dish: DiningItem) {
    const yes = await confirm({
      title: t("ow.dn.delDishTitle", { name: tr(dish.name) }),
      message: t("ow.ui.cannotUndo"),
      confirmLabel: t("ow.del"),
      tone: "danger",
    });
    if (!yes) return;
    const ok = await jsonFetch(`/api/dining/items/${dish.id}`, { method: "DELETE" });
    if (ok) toast(t("ow.ui.deletedName", { name: tr(dish.name) }));
    else toast(t("ow.ui.deleteFailed"), "error");
    await refresh(true);
  }

  if (categories === null) return <OwnerSkeleton />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-white">
          {t("ow.dining")}
        </h1>
        <button
          type="button"
          onClick={openAddCategory}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3d8ae6]"
        >
          <Plus className="h-5 w-5" aria-hidden />
          {t("ow.addCategory")}
        </button>
      </div>

      <ReservationsPanel />

      <h2 className="mb-4 mt-10 font-display text-2xl font-semibold text-white">
        {t("ow.theMenu")}
      </h2>

      {categories.length === 0 ? (
        <div className="owner-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-white/60">{t("ow.dn.emptyMenu")}</p>
        </div>
      ) : null}

      <div className="space-y-6">
        {categories.map((cat) => (
          <section
            key={cat.id}
            className={cn(
              "owner-panel rounded-2xl p-6 md:p-8",
              !cat.published && "opacity-60"
            )}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">
                  {tr(cat.name)}
                </h2>
                {!cat.published ? (
                  <span className="mt-1 inline-block rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white/70">
                    {t("ow.ui.hiddenFromGuests")}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PublishSwitch
                  checked={cat.published}
                  label={tr(cat.name)}
                  onToggle={() => toggleCategoryPublished(cat)}
                />
                <button
                  type="button"
                  onClick={() => openAddDish(cat)}
                  className="owner-control inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t("ow.addDish")}
                </button>
                <button
                  type="button"
                  onClick={() => openEditCategory(cat)}
                  className="owner-control min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold text-white"
                >
                  {t("ow.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory(cat)}
                  className="min-h-[44px] rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300"
                >
                  {t("ow.del")}
                </button>
              </div>
            </div>

            {cat.items.length === 0 ? (
              <p className="text-sm text-white/55">{t("ow.dn.noDishes")}</p>
            ) : (
              <ul className="space-y-3">
                {cat.items.map((dish) => (
                  <li
                    key={dish.id}
                    className={cn(
                      "owner-inset flex flex-wrap items-center gap-3 rounded-xl px-4 py-3",
                      !dish.published && "opacity-60"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">
                        {tr(dish.name)}
                        <span className="ml-3 font-display text-gold">
                          {formatBaht(dish.price)}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-white/55">
                        {tr(dish.description)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PublishSwitch
                        checked={dish.published}
                        label={tr(dish.name)}
                        onToggle={() => toggleDishPublished(dish)}
                      />
                      <button
                        type="button"
                        onClick={() => openEditDish(dish)}
                        className="owner-control min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold text-white"
                      >
                        {t("ow.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDish(dish)}
                        className="min-h-[44px] rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300"
                      >
                        {t("ow.del")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Category modal */}
      <OwnerModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? t("ow.edit") : t("ow.addCategory")}
        dirty={catModalOpen && JSON.stringify(catForm) !== catBaseline}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.nameEn")} error={nameError}>
              <input
                value={catForm.name.en}
                onChange={(e) =>
                  setCatForm((p) => ({
                    ...p,
                    name: { ...p.name, en: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label={t("ow.f.nameTh")}>
              <input
                value={catForm.name.th}
                onChange={(e) =>
                  setCatForm((p) => ({
                    ...p,
                    name: { ...p.name, th: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <ImageUploadField
            label={t("ow.f.categoryImage")}
            value={catForm.image}
            folder="dining-categories"
            onChange={(url) => setCatForm((p) => ({ ...p, image: url }))}
            hint={t("ow.hint.category")}
          />
          <Field label={t("ow.f.visibility")} tip={t("ow.tip.dining.visibility")}>
            <OwnerListbox
              value={catForm.published ? "yes" : "no"}
              onChange={(v) =>
                setCatForm((p) => ({ ...p, published: v === "yes" }))
              }
              options={[
                { value: "yes", label: t("ow.published") },
                { value: "no", label: t("ow.hidden") },
              ]}
            />
          </Field>
        </div>
        <ModalActions
          onCancel={() => setCatModalOpen(false)}
          onSave={() => void saveCategory()}
          cancelLabel={t("ow.cancel")}
          saveLabel={saving ? t("ow.setSaving") : t("ow.save")}
          saving={saving}
          error={catError || undefined}
        />
      </OwnerModal>

      {/* Dish modal */}
      <OwnerModal
        open={dishModalOpen}
        onClose={() => setDishModalOpen(false)}
        title={editingDish ? t("ow.edit") : t("ow.addDish")}
        dirty={dishModalOpen && JSON.stringify(dishForm) !== dishBaseline}
      >
        <div className="space-y-5">
          <Field label={t("ow.f.category")}>
            <OwnerListbox
              value={dishForm.categoryId}
              onChange={(v) => setDishForm((p) => ({ ...p, categoryId: v }))}
              options={(categories ?? []).map((c) => ({
                value: c.id,
                label: tr(c.name),
              }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.nameEn")} error={nameError}>
              <input
                value={dishForm.name.en}
                onChange={(e) =>
                  setDishForm((p) => ({
                    ...p,
                    name: { ...p.name, en: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label={t("ow.f.nameTh")}>
              <input
                value={dishForm.name.th}
                onChange={(e) =>
                  setDishForm((p) => ({
                    ...p,
                    name: { ...p.name, th: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.descEn")}>
              <textarea
                rows={3}
                value={dishForm.description.en}
                onChange={(e) =>
                  setDishForm((p) => ({
                    ...p,
                    description: { ...p.description, en: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label={t("ow.f.descTh")}>
              <textarea
                rows={3}
                value={dishForm.description.th}
                onChange={(e) =>
                  setDishForm((p) => ({
                    ...p,
                    description: { ...p.description, th: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.price")} tip={t("ow.tip.dining.price")}>
              <input
                type="number"
                min={0}
                value={dishForm.price}
                onChange={(e) =>
                  setDishForm((p) => ({
                    ...p,
                    price: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label={t("ow.f.visibility")} tip={t("ow.tip.dining.visibility")}>
              <OwnerListbox
                value={dishForm.published ? "yes" : "no"}
                onChange={(v) =>
                  setDishForm((p) => ({ ...p, published: v === "yes" }))
                }
                options={[
                  { value: "yes", label: t("ow.published") },
                  { value: "no", label: t("ow.hidden") },
                ]}
              />
            </Field>
          </div>
          <ImageUploadField
            label={t("ow.f.dishPhoto")}
            value={dishForm.image}
            folder="dining-dishes"
            onChange={(url) => setDishForm((p) => ({ ...p, image: url }))}
            hint={t("ow.hint.dish")}
          />
        </div>
        <ModalActions
          onCancel={() => setDishModalOpen(false)}
          onSave={() => void saveDish()}
          cancelLabel={t("ow.cancel")}
          saveLabel={saving ? t("ow.setSaving") : t("ow.save")}
          saving={saving}
          error={dishError || undefined}
        />
      </OwnerModal>
    </div>
  );
}

const inputClass = "min-h-[44px] w-full px-4 py-3 text-base";

/** The owner form field with optional ? help and inline error (OwnerUI). */
const Field = OwnerFormField;

function PublishSwitch({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${t("ow.published")} · ${label}`}
      onClick={onToggle}
      className={cn(
        "relative h-7 w-12 rounded-full transition",
        checked ? "bg-deal" : "bg-white/20"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}
