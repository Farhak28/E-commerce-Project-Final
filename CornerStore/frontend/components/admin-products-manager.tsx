"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { AdminPagination, AdminSearchBar } from "@/components/admin/admin-ui";
import { Button, Card, Input } from "@/components/ui";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
  uploadProductImage,
} from "@/lib/services/admin";
import { getBrands, getTypes } from "@/lib/services/products";
import type { BrandDTO, TypeDTO } from "@/lib/types";
import { normalizePictureUrlForStorage, resolvePictureUrl } from "@/lib/utils/images";
import { mapProductDTO } from "@/lib/utils/product";
import type { Product } from "@/lib/types";

type ProductFormState = {
  name: string;
  description: string;
  pictureUrl: string;
  price: string;
  stockQuantity: string;
  productBrandId: string;
  productTypeId: string;
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  pictureUrl: "",
  price: "",
  stockQuantity: "100",
  productBrandId: "",
  productTypeId: "",
};

function toForm(product: Product, brands: BrandDTO[], types: TypeDTO[]): ProductFormState {
  const brand = brands.find((b) => b.name === product.productBrand);
  const type = types.find((t) => t.name === product.productType);
  return {
    name: product.name,
    description: product.description,
    pictureUrl: normalizePictureUrlForStorage(product.pictureUrl),
    price: String(product.price),
    stockQuantity: String(product.stock),
    productBrandId: brand ? String(brand.id) : "",
    productTypeId: type ? String(type.id) : "",
  };
}

export function AdminProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [types, setTypes] = useState<TypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async (p = page, q = appliedSearch) => {
    setLoading(true);
    try {
      const [productList, brandList, typeList] = await Promise.all([
        getAdminProducts({ search: q || undefined, page: p, pageSize }),
        getBrands(),
        getTypes(),
      ]);
      setProducts(productList.items.map(mapProductDTO));
      setTotalCount(productList.totalCount);
      setBrands(brandList);
      setTypes(typeList);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(page, appliedSearch);
  }, [page, appliedSearch]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      productBrandId: brands[0] ? String(brands[0].id) : "",
      productTypeId: types[0] ? String(types[0].id) : "",
    });
    setError(null);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm(toForm(product, brands, types));
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, pictureUrl: result.pictureUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      pictureUrl: normalizePictureUrlForStorage(form.pictureUrl),
      price: Number(form.price),
      productBrandId: Number(form.productBrandId),
      productTypeId: Number(form.productTypeId),
      stockQuantity: Number(form.stockQuantity) || 100,
    };

    if (!payload.name || !payload.description || !payload.pictureUrl || !payload.price) {
      setError("Please fill in all required fields and add a product image.");
      setSaving(false);
      return;
    }

    try {
      if (editingId != null) {
        await updateAdminProduct(editingId, payload);
      } else {
        await createAdminProduct(payload);
      }
      closeForm();
      await load(page, appliedSearch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteAdminProduct(id);
      if (editingId === id) closeForm();
      await load(page, appliedSearch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete product.");
    }
  };

  const previewUrl = form.pictureUrl ? resolvePictureUrl(form.pictureUrl) : "";

  return (
    <div className="space-y-6">
      <AdminSearchBar
        value={search}
        onChange={setSearch}
        onSubmit={() => {
          setPage(1);
          setAppliedSearch(search);
        }}
        placeholder="Search products…"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!loading ? (
            <p className="text-sm text-text-muted">
              {totalCount} product{totalCount === 1 ? "" : "s"} total
            </p>
          ) : null}
        </div>
        <Button type="button" onClick={openCreate}>
          Add product
        </Button>
      </div>

      {error ? <p className="text-sm text-accent">{error}</p> : null}

      {showForm ? (
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold">
              {editingId != null ? "Edit product" : "New product"}
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">Name</span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">Price</span>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">Stock quantity</span>
                <Input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm((p) => ({ ...p, stockQuantity: e.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">Brand</span>
                <select
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                  value={form.productBrandId}
                  onChange={(e) => setForm((p) => ({ ...p, productBrandId: e.target.value }))}
                  required
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">Category</span>
                <select
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                  value={form.productTypeId}
                  onChange={(e) => setForm((p) => ({ ...p, productTypeId: e.target.value }))}
                  required
                >
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="text-text-muted">Description</span>
              <textarea
                className="min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                required
              />
            </label>

            <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold">Product image</p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading…" : "Upload image"}
                </Button>
                <span className="text-xs text-text-muted">or paste an image URL</span>
              </div>
              <Input
                placeholder="https://… or /images/products/…"
                value={form.pictureUrl}
                onChange={(e) => setForm((p) => ({ ...p, pictureUrl: e.target.value }))}
                required
              />
              {previewUrl ? (
                <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-xl border border-border">
                  <ProductImage src={previewUrl} alt="Preview" fill sizes="320px" className="object-cover" />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || uploading}>
                {saving ? "Saving…" : editingId != null ? "Update product" : "Create product"}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-text-muted">Loading products…</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border">
                    <ProductImage
                      src={product.pictureUrl}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-text-muted">
                      {product.productType} — {product.productBrand}
                    </p>
                    <p className="text-sm font-semibold text-primary">${product.price}</p>
                    <p className="text-xs text-text-muted">Stock: {product.stock}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => openEdit(product)}>
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void handleDelete(product.id, product.name)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          <AdminPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
