"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useBusiness } from "@/hooks/useBusinessData";
import { todayKey } from "@/lib/dates";
import { formatCurrency } from "@/lib/calculations";
import { PRODUCT_STATUSES, type Product, type ProductStatus } from "@/types/business";

export interface ProductFormModalProps {
  open: boolean;
  /** Present → edit mode; absent → create mode. */
  product?: Product | null;
  /** Existing categories, offered as autocomplete suggestions. */
  categories: string[];
  onClose: () => void;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  status: ProductStatus;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

function toFormState(product: Product | null | undefined): FormState {
  if (!product) {
    return {
      name: "",
      description: "",
      price: "0",
      category: "",
      stock: "0",
      status: "active",
    };
  }
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    category: product.category,
    stock: String(product.stock),
    status: product.status,
  };
}

/**
 * Create / edit dialog for a catalog product.
 * Mounted only while open so the draft always starts from the target record.
 */
export function ProductFormModal({ open, product, categories, onClose }: ProductFormModalProps) {
  const { actions, business, hydrated } = useBusiness();
  const { addProduct, updateProduct } = actions;

  const [state, setState] = useState<FormState>(() => toFormState(product));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  if (!open || !hydrated) return null;

  const isEdit = Boolean(product);

  function patch(partial: Partial<FormState>) {
    setState((prev) => ({ ...prev, ...partial }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(partial)) delete next[key as keyof FormState];
      return next;
    });
  }

  function validate(): FieldErrors {
    const found: FieldErrors = {};
    if (state.name.trim().length < 2) found.name = "Enter a name of at least 2 characters.";

    const price = Number(state.price);
    if (!Number.isFinite(price) || price < 0) found.price = "Price must be 0 or more.";
    if (state.category.trim() === "") found.category = "Give this product a category.";

    const stock = Number(state.stock);
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      found.stock = "Stock must be a whole number of 0 or more.";
    }

    return found;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);

    const payload = {
      name: state.name.trim(),
      description: state.description.trim(),
      price: Math.round(Number(state.price) * 100) / 100,
      category: state.category.trim(),
      stock: Number(state.stock),
      status: state.status,
    };

    if (isEdit && product) updateProduct(product.id, payload);
    else addProduct({ ...payload, createdAt: todayKey() });

    onClose();
  }

  const preview = Number.isFinite(Number(state.price)) ? Number(state.price) : 0;

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={isEdit ? "Edit product" : "New product"}
      description={
        isEdit
          ? "Price changes only affect future orders — existing lines keep their captured price."
          : "Add a product so orders can pick it from the catalog."
      }
      dismissOnBackdrop={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        <datalist id="product-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Name"
            value={state.name}
            onChange={(event) => patch({ name: event.target.value })}
            error={errors.name}
            data-autofocus
            required
          />
          <Input
            label="Category"
            list="product-categories"
            value={state.category}
            onChange={(event) => patch({ category: event.target.value })}
            error={errors.category}
            placeholder="Software"
            hint="Suggestions come from your existing categories."
          />
        </div>

        <Textarea
          label="Description"
          rows={3}
          value={state.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="What the customer actually receives."
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Price"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={state.price}
            onChange={(event) => patch({ price: event.target.value })}
            error={errors.price}
            hint={formatCurrency(preview, business.currency)}
          />
          <Input
            label="Stock"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={state.stock}
            onChange={(event) => patch({ stock: event.target.value })}
            error={errors.stock}
            hint="Units on hand."
          />
          <Select
            label="Status"
            value={state.status}
            onChange={(event) => patch({ status: event.target.value as ProductStatus })}
            options={PRODUCT_STATUSES.map((value) => ({
              value,
              label: STATUS_LABELS[value],
            }))}
          />
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;
