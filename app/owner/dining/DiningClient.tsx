"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Plus, X } from "lucide-react";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";
import type { DiningCategory, DiningItem } from "@/lib/dining";
import { useI18n } from "@/lib/i18n";
import { cn, formatBaht } from "@/lib/utils";

type CategoryForm = { name: { en: string; th: string }; published: boolean };
type DishForm = {
  categoryId: string;
  name: { en: string; th: string };
  description: { en: string; th: string };
  price: number;
  published: boolean;
};

function emptyCategory(): CategoryForm {
  return { name: { en: "", th: "" }, published: true };
}

function emptyDish(categoryId: string): DishForm {
  return {
    categoryId,
    name: { en: "", th: "" },
    description: { en: "", th: "" },
    price: 200,
    published: true,
  };
}

async function jsonFetch(url: string, init?: RequestInit): Promise<boolean> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return res.ok;
}

/**
 * Dining manager · category + dish CRUD, DB-backed like rooms. The list is
 * small, so every mutation goes to the server first and the whole menu is
 * refetched · no optimistic bookkeeping to drift.
 */
export default function OwnerDiningPage() {
  const { t, tr } = useI18n();
  const [categories, setCategories] = useState<DiningCategory[] | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<DiningCategory | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCategory);

  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DiningItem | null>(null);
  const [dishForm, setDishForm] = useState<DishForm>(() => emptyDish(""));

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dining", { cache: "no-store" });
      if (res.ok) setCategories((await res.json()) as DiningCategory[]);
      else setCategories([]);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openAddCategory() {
    setEditingCat(null);
    setCatForm(emptyCategory());
    setCatModalOpen(true);
  }

  function openEditCategory(cat: DiningCategory) {
    setEditingCat(cat);
    setCatForm({ name: { ...cat.name }, published: cat.published });
    setCatModalOpen(true);
  }

  async function saveCategory() {
    if (!catForm.name.en.trim()) return;
    const name = {
      en: catForm.name.en.trim(),
      th: catForm.name.th.trim() || catForm.name.en.trim(),
    };
    if (editingCat) {
      await jsonFetch(`/api/dining/categories/${editingCat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, published: catForm.published }),
      });
    } else {
      const order = categories?.length ?? 0;
      await jsonFetch("/api/dining/categories", {
        method: "POST",
        body: JSON.stringify({ name, order, published: catForm.published }),
      });
    }
    setCatModalOpen(false);
    await refresh();
  }

  async function toggleCategoryPublished(cat: DiningCategory) {
    await jsonFetch(`/api/dining/categories/${cat.id}`, {
      method: "PATCH",
      body: JSON.stringify({ published: !cat.published }),
    });
    await refresh();
  }

  async function deleteCategory(cat: DiningCategory) {
    if (!window.confirm(t("ow.sure"))) return;
    await jsonFetch(`/api/dining/categories/${cat.id}`, { method: "DELETE" });
    await refresh();
  }

  function openAddDish(cat: DiningCategory) {
    setEditingDish(null);
    setDishForm(emptyDish(cat.id));
    setDishModalOpen(true);
  }

  function openEditDish(dish: DiningItem) {
    setEditingDish(dish);
    setDishForm({
      categoryId: dish.categoryId,
      name: { ...dish.name },
      description: { ...dish.description },
      price: dish.price,
      published: dish.published,
    });
    setDishModalOpen(true);
  }

  async function saveDish() {
    if (!dishForm.name.en.trim() || !dishForm.categoryId) return;
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
      published: dishForm.published,
    };
    if (editingDish) {
      await jsonFetch(`/api/dining/items/${editingDish.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      const cat = categories?.find((c) => c.id === dishForm.categoryId);
      const order = cat?.items.length ?? 0;
      await jsonFetch("/api/dining/items", {
        method: "POST",
        body: JSON.stringify({ ...payload, order }),
      });
    }
    setDishModalOpen(false);
    await refresh();
  }

  async function toggleDishPublished(dish: DiningItem) {
    await jsonFetch(`/api/dining/items/${dish.id}`, {
      method: "PATCH",
      body: JSON.stringify({ published: !dish.published }),
    });
    await refresh();
  }

  async function deleteDish(dish: DiningItem) {
    if (!window.confirm(t("ow.sure"))) return;
    await jsonFetch(`/api/dining/items/${dish.id}`, { method: "DELETE" });
    await refresh();
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
          Add category
        </button>
      </div>

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
                    Hidden from guests
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PublishSwitch
                  checked={cat.published}
                  onToggle={() => toggleCategoryPublished(cat)}
                />
                <button
                  type="button"
                  onClick={() => openAddDish(cat)}
                  className="owner-control inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add dish
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
              <p className="text-sm text-white/55">No dishes yet.</p>
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
        title={editingCat ? t("ow.edit") : "Add category"}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name EN">
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
            <Field label="Name TH">
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
          <Field label="Visibility">
            <OwnerListbox
              value={catForm.published ? "yes" : "no"}
              onChange={(v) =>
                setCatForm((p) => ({ ...p, published: v === "yes" }))
              }
              options={[
                { value: "yes", label: "Published" },
                { value: "no", label: "Hidden" },
              ]}
            />
          </Field>
        </div>
        <ModalActions
          onCancel={() => setCatModalOpen(false)}
          onSave={saveCategory}
          cancelLabel={t("ow.cancel")}
          saveLabel={t("ow.save")}
        />
      </OwnerModal>

      {/* Dish modal */}
      <OwnerModal
        open={dishModalOpen}
        onClose={() => setDishModalOpen(false)}
        title={editingDish ? t("ow.edit") : "Add dish"}
      >
        <div className="space-y-5">
          <Field label="Category">
            <OwnerListbox
              value={dishForm.categoryId}
              onChange={(v) => setDishForm((p) => ({ ...p, categoryId: v }))}
              options={(categories ?? []).map((c) => ({
                value: c.id,
                label: c.name.en,
              }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name EN">
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
            <Field label="Name TH">
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
            <Field label="Description EN">
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
            <Field label="Description TH">
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
            <Field label="Price (฿)">
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
            <Field label="Visibility">
              <OwnerListbox
                value={dishForm.published ? "yes" : "no"}
                onChange={(v) =>
                  setDishForm((p) => ({ ...p, published: v === "yes" }))
                }
                options={[
                  { value: "yes", label: "Published" },
                  { value: "no", label: "Hidden" },
                ]}
              />
            </Field>
          </div>
        </div>
        <ModalActions
          onCancel={() => setDishModalOpen(false)}
          onSave={saveDish}
          cancelLabel={t("ow.cancel")}
          saveLabel={t("ow.save")}
        />
      </OwnerModal>
    </div>
  );
}

const inputClass = "min-h-[44px] w-full px-4 py-3 text-base";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-white/80">{label}</div>
      {children}
    </div>
  );
}

function PublishSwitch({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "Published" : "Hidden"}
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

export function OwnerModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-modal">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <DialogPanel className="own-theme owner-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-brand p-6">
              <div className="mb-6 flex items-center justify-between">
                <DialogTitle className="font-display text-xl font-semibold text-white">
                  {title}
                </DialogTitle>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white/60 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export function ModalActions({
  onCancel,
  onSave,
  cancelLabel,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  cancelLabel: string;
  saveLabel: string;
}) {
  return (
    <div className="mt-8 flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="owner-control min-h-[44px] flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white/70"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        className="min-h-[44px] flex-1 rounded-xl bg-own-blue px-4 py-3 text-sm font-extrabold text-white"
      >
        {saveLabel}
      </button>
    </div>
  );
}
