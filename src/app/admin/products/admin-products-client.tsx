"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnFiltersState, FilterFn } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, RefreshCw, Search, X } from "lucide-react";
import { moneyUsd } from "@/components/admin/format";
import { includesStringFilter } from "@/lib/admin-table-filters";
import { productImagePublicPath } from "@/lib/catalog-shared";

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string | null;
  priceCents: number;
  categoryId: string;
  categoryTitle: string;
  imageFolder: string;
  imageFile: string;
  imageAlt: string | null;
  description: string | null;
  requiresVariation: boolean;
  variationCount: number;
  createdAt: string;
  updatedAt: string;
};

const col = createColumnHelper<AdminProductRow>();

function ProductThumb({ row, className }: { row: AdminProductRow; className?: string }) {
  const src = productImagePublicPath(row.imageFolder, row.imageFile);
  const [broken, setBroken] = useState(false);
  const box = className ?? "h-12 w-12";
  if (broken) {
    return (
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-xl border border-dashed border-black/15 bg-surface-muted text-[10px] font-semibold text-muted ${box}`}
      >
        —
      </div>
    );
  }
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white ${box}`}>
      <Image
        src={src}
        alt={row.imageAlt ?? row.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 30vw, 48px"
        onError={() => setBroken(true)}
        unoptimized
      />
    </div>
  );
}

export function AdminProductsClient() {
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [edit, setEdit] = useState<AdminProductRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await fetch("/api/admin/products");
    if (!r.ok) {
      setError(r.status === 401 ? "Unauthorized." : "Could not load products.");
      setRows([]);
      setLoading(false);
      return;
    }
    const j = (await r.json()) as { products: AdminProductRow[] };
    setRows(j.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    () => [
      col.display({
        id: "thumb",
        header: () => <span className="sr-only">Image</span>,
        enableColumnFilter: false,
        cell: ({ row }) => <ProductThumb row={row.original} />,
      }),
      col.accessor("categoryTitle", {
        header: "Category",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => <span className="text-muted">{c.getValue()}</span>,
      }),
      col.accessor("name", {
        header: "Product",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => <span className="font-semibold text-foreground">{c.getValue()}</span>,
      }),
      col.accessor((row) => moneyUsd(row.priceCents), {
        id: "priceDisplay",
        header: () => <span className="block text-right">Price</span>,
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{moneyUsd(row.original.priceCents)}</span>
        ),
      }),
      col.accessor("variationCount", {
        header: () => <span className="text-center">Var.</span>,
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => <span className="block text-center tabular-nums">{c.getValue()}</span>,
      }),
      col.accessor("slug", {
        header: "Slug",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => <span className="max-w-[140px] truncate font-mono text-xs">{c.getValue() ?? "—"}</span>,
      }),
      col.display({
        id: "actions",
        header: "",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setEdit(row.original)}
            aria-label={`Edit ${row.original.name}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-foreground shadow-sm transition hover:bg-surface-muted"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
        ),
      }),
    ],
    [],
  );

  const productGlobalFilter: FilterFn<AdminProductRow> = (row, _columnId, filterValue) => {
    const q = String(filterValue ?? "").trim().toLowerCase();
    if (!q) return true;
    const p = row.original;
    const blob = [p.name, p.slug ?? "", p.categoryTitle, moneyUsd(p.priceCents), String(p.variationCount)]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  };

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
    globalFilterFn: productGlobalFilter,
  });

  function mergeProduct(updated: AdminProductRow) {
    setRows((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  const pageRows = table.getRowModel().rows;
  const filterRowVisible = table.getHeaderGroups()[0]?.headers.some((h) => h.column.getCanFilter()) ?? false;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Live inventory from Postgres. Use column filters or search. Image paths stay read-only until R2.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-surface-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Refresh
          </button>
        </div>
      </motion.div>

      {error ? (
        <p className="rounded-xl border border-chart-alert/30 bg-chart-alert/10 px-4 py-3 text-sm font-medium text-foreground">
          {error}
        </p>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-black/5 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search all columns…"
              className="w-full rounded-xl border border-black/10 bg-surface-muted/30 py-2.5 pl-10 pr-3 text-sm outline-none ring-ring/25 focus:ring-4"
            />
          </div>
          <p className="text-xs text-muted">
            {table.getFilteredRowModel().rows.length} of {rows.length} products
          </p>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted">Loading products…</p>
          ) : pageRows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No products match filters.</p>
          ) : (
            <div className="space-y-3 p-4">
              {pageRows.map((row, i) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
                  className="flex gap-3 rounded-2xl border border-black/8 bg-surface-muted/20 p-4 shadow-sm"
                >
                  <ProductThumb row={row.original} className="h-20 w-20 shrink-0 sm:h-16 sm:w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      {row.original.categoryTitle}
                    </p>
                    <p className="mt-0.5 font-semibold text-foreground">{row.original.name}</p>
                    <p className="mt-1 text-sm font-bold text-primary">{moneyUsd(row.original.priceCents)}</p>
                    <p className="mt-1 text-xs text-muted">
                      {row.original.variationCount} var. · {row.original.slug ?? "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Edit ${row.original.name}`}
                    onClick={() => setEdit(row.original)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl border border-black/10 bg-white text-foreground shadow-sm"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-black/5 bg-surface-muted/40 text-muted">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide lg:px-4">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
              {filterRowVisible ? (
                <tr className="border-b border-black/5 bg-white">
                  {table.getHeaderGroups()[0]?.headers.map((h) => (
                    <th key={`f-${h.id}`} className="px-2 py-2 align-top lg:px-3">
                      {h.column.getCanFilter() ? (
                        <input
                          type="text"
                          value={(h.column.getFilterValue() as string) ?? ""}
                          onChange={(e) => h.column.setFilterValue(e.target.value)}
                          placeholder="Filter…"
                          className="w-full min-w-0 rounded-lg border border-black/10 px-2 py-1.5 text-xs outline-none ring-ring/20 focus:ring-2"
                          aria-label={`Filter ${String(h.column.id)}`}
                        />
                      ) : (
                        <span className="block h-8" />
                      )}
                    </th>
                  ))}
                </tr>
              ) : null}
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center text-muted">
                    Loading products…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center text-muted">
                    No products match filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="bg-white transition hover:bg-surface-muted/20">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-middle lg:px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-black/5 p-4 sm:flex-row sm:items-center">
          <p className="text-xs text-muted">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {edit ? (
          <ProductEditDrawer
            key={edit.id}
            product={edit}
            onClose={() => setEdit(null)}
            onSaved={(p) => {
              mergeProduct(p);
              setEdit(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DrawerProductImage({ product }: { product: AdminProductRow }) {
  const src = productImagePublicPath(product.imageFolder, product.imageFile);
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-black/15 bg-surface-muted text-sm font-semibold text-muted">
        —
      </div>
    );
  }
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-black/10 bg-white">
      <Image
        src={src}
        alt={product.imageAlt ?? product.name}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 85vw, 200px"
        onError={() => setBroken(true)}
        unoptimized
      />
    </div>
  );
}

function ProductEditDrawer({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProductRow;
  onClose: () => void;
  onSaved: (p: AdminProductRow) => void;
}) {
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug ?? "");
  const [price, setPrice] = useState(String(product.priceCents / 100));
  const [imageAlt, setImageAlt] = useState(product.imageAlt ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [requiresVariation, setRequiresVariation] = useState(product.requiresVariation);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const priceCents = Math.round(Number(price) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setFormError("Invalid price.");
      return;
    }
    setSaving(true);
    const r = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim() || null,
        priceCents,
        imageAlt: imageAlt.trim() || null,
        description: description.trim() || null,
        requiresVariation,
      }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: unknown };
      setFormError(typeof j.error === "string" ? j.error : "Save failed.");
      return;
    }
    const j = (await r.json()) as { product: AdminProductRow };
    onSaved(j.product);
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:mx-4 sm:max-h-[min(90dvh,760px)] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-4 sm:px-5">
          <h2 id="edit-product-title" className="font-heading text-lg font-extrabold text-foreground">
            Edit product
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-foreground"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={(e) => void handleSave(e)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <p className="text-xs text-muted">
              <span className="font-semibold text-foreground">ID:</span> {product.id} ·{" "}
              <span className="font-semibold text-foreground">Category:</span> {product.categoryTitle}
            </p>
            {formError ? (
              <p className="rounded-lg border border-chart-alert/30 bg-chart-alert/10 px-3 py-2 text-sm text-foreground">
                {formError}
              </p>
            ) : null}
            <div className="rounded-xl border border-black/10 bg-surface-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Product image</p>
              <div className="mt-3 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
                <div className="mx-auto w-full max-w-[min(100%,240px)] sm:mx-0 sm:max-w-[200px]">
                  <DrawerProductImage product={product} />
                </div>
                <div className="min-w-0 flex-1 space-y-1 text-xs">
                  <p className="break-all font-mono text-muted">
                    {productImagePublicPath(product.imageFolder, product.imageFile)}
                  </p>
                  <p className="text-muted">
                    Path and filename are read-only for now. R2 upload/replace will be added here later.
                  </p>
                </div>
              </div>
            </div>
            <label className="block text-sm font-medium text-foreground">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none ring-ring/25 focus:ring-4"
                required
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Slug
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 font-mono text-sm outline-none ring-ring/25 focus:ring-4"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Price (USD)
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm tabular-nums outline-none ring-ring/25 focus:ring-4"
                required
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Image alt
              <input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none ring-ring/25 focus:ring-4"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1.5 w-full resize-y rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none ring-ring/25 focus:ring-4"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={requiresVariation}
                onChange={(e) => setRequiresVariation(e.target.checked)}
                className="h-4 w-4 rounded border-black/20"
              />
              Requires variation (customer must pick SKU)
            </label>
          </div>
          <div className="flex flex-col gap-2 border-t border-black/5 bg-surface-muted/30 px-4 py-4 sm:flex-row sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-black/10 py-3 text-sm font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
