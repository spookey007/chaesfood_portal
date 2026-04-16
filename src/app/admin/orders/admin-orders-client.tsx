"use client";

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
import { motion } from "framer-motion";
import { Eye, RefreshCw, Search } from "lucide-react";
import { OrderDetailModal } from "@/components/admin/order-detail-modal";
import { moneyUsd } from "@/components/admin/format";
import { includesStringFilter } from "@/lib/admin-table-filters";
import { OrderStatus } from "@/generated/prisma/enums";

type OrderItem = {
  id: string;
  lineSku: string;
  productName: string;
  quantity: number;
  lineTotalCents: number;
  productId?: string | null;
  variationExternalId?: string | null;
  imageFolder?: string | null;
  imageFile?: string | null;
  unitPriceCents?: number;
};

export type AdminOrderRow = {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentType: string | null;
  paymentStatus: string;
  totalCents: number;
  currency: string;
  note: string | null;
  deliveryAddress: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user: { id: string; email: string; name: string | null } | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

const col = createColumnHelper<AdminOrderRow>();

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};

const statusSelectStyles: Record<OrderStatus, string> = {
  DRAFT: "border-slate-300/90 bg-slate-100 text-slate-900",
  PENDING_PAYMENT: "border-amber-400/70 bg-amber-50 text-amber-950",
  PAID: "border-emerald-400/70 bg-emerald-50 text-emerald-950",
  FULFILLED: "border-sky-400/70 bg-sky-50 text-sky-950",
  CANCELLED: "border-red-400/70 bg-red-50 text-red-950",
};

function statusSelectClass(status: OrderStatus) {
  return statusSelectStyles[status] ?? "border-black/10 bg-white text-foreground";
}

const orderGlobalFilter: FilterFn<AdminOrderRow> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "").trim().toLowerCase();
  if (!q) return true;
  const o = row.original;
  const blob = [
    o.reference,
    o.user?.email,
    o.user?.name,
    o.guestEmail,
    o.guestName,
    o.paymentStatus,
    o.status,
    moneyUsd(o.totalCents),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
};

export function AdminOrdersClient() {
  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await fetch("/api/admin/orders");
    if (!r.ok) {
      setError(r.status === 401 ? "Unauthorized." : "Could not load orders.");
      setRows([]);
      setLoading(false);
      return;
    }
    const j = (await r.json()) as { orders: AdminOrderRow[] };
    setRows(j.orders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (!r.ok) return;
    const j = (await r.json()) as { order: AdminOrderRow };
    setRows((prev) => prev.map((o) => (o.id === id ? j.order : o)));
  }, []);

  const columns = useMemo(
    () => [
      col.accessor("reference", {
        header: "Reference",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => <span className="font-mono text-xs font-semibold">{c.getValue()}</span>,
      }),
      col.accessor(
        (row) =>
          [row.user?.name, row.user?.email, row.guestName, row.guestEmail].filter(Boolean).join(" · "),
        {
          id: "customer",
          header: "Customer",
          enableColumnFilter: true,
          filterFn: includesStringFilter,
          cell: ({ row }) => {
            const o = row.original;
            if (o.user) {
              return (
                <div>
                  <p className="font-medium text-foreground">{o.user.name ?? o.user.email}</p>
                  <p className="text-xs text-muted">{o.user.email}</p>
                </div>
              );
            }
            return (
              <div>
                <p className="font-medium text-foreground">{o.guestName ?? "Guest"}</p>
                <p className="text-xs text-muted">{o.guestEmail ?? "—"}</p>
              </div>
            );
          },
        },
      ),
      col.accessor((row) => moneyUsd(row.totalCents), {
        id: "totalDisplay",
        header: () => <span className="block text-right">Total</span>,
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: ({ row }) => (
          <span className="block text-right font-semibold tabular-nums">{moneyUsd(row.original.totalCents)}</span>
        ),
      }),
      col.accessor("status", {
        header: "Status",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: ({ row }) => (
          <select
            value={row.original.status}
            disabled={updatingId === row.original.id}
            onChange={(e) => void updateStatus(row.original.id, e.target.value as OrderStatus)}
            className={`max-w-[200px] rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none ring-ring/25 focus:ring-2 ${statusSelectClass(row.original.status)}`}
          >
            {(Object.keys(statusLabels) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        ),
      }),
      col.accessor("paymentStatus", {
        header: "Payment",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => (
          <span className="text-xs text-muted">{String(c.getValue()).replace(/_/g, " ").toLowerCase()}</span>
        ),
      }),
      col.accessor((row) => new Date(row.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }), {
        id: "placedDisplay",
        header: "Placed",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted">
            {new Date(row.original.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </span>
        ),
      }),
      col.display({
        id: "view",
        header: "",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDetailOrderId(row.original.id)}
              aria-label={`View order ${row.original.reference}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition hover:bg-primary/20"
            >
              <Eye className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ),
      }),
    ],
    [updateStatus, updatingId],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
    globalFilterFn: orderGlobalFilter,
  });

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Customer orders from the database. Change fulfillment status here; line items open in the detail view.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-surface-muted disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
          Refresh
        </button>
      </motion.div>

      {error ? (
        <p className="rounded-xl border border-chart-alert/30 bg-chart-alert/10 px-4 py-3 text-sm font-medium">
          {error}
        </p>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-black/5 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search reference, email, name, status…"
              className="w-full rounded-xl border border-black/10 bg-surface-muted/30 py-2.5 pl-10 pr-3 text-sm outline-none ring-ring/25 focus:ring-4"
            />
          </div>
          <p className="text-xs text-muted">
            {table.getFilteredRowModel().rows.length} of {rows.length} orders
          </p>
        </div>

        <div className="md:hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted">Loading orders…</p>
          ) : pageRows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No orders match filters.</p>
          ) : (
            <div className="space-y-3 p-4">
              {pageRows.map((row, i) => {
                const o = row.original;
                const customerLine = o.user ? (o.user.name ?? o.user.email) : (o.guestName ?? "Guest");
                const emailLine = o.user ? o.user.email : (o.guestEmail ?? "—");
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.28), duration: 0.3 }}
                    className="rounded-2xl border border-black/8 bg-surface-muted/15 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-primary">{o.reference}</p>
                        <p className="mt-1 font-semibold text-foreground">{customerLine}</p>
                        <p className="text-xs text-muted">{emailLine}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`View order ${o.reference}`}
                        onClick={() => setDetailOrderId(o.id)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"
                      >
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                    <p className="mt-2 text-lg font-bold text-foreground">{moneyUsd(o.totalCents)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={(e) => void updateStatus(o.id, e.target.value as OrderStatus)}
                        className={`min-w-0 flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${statusSelectClass(o.status)}`}
                      >
                        {(Object.keys(statusLabels) as OrderStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-2 text-[11px] text-muted">
                      {o.paymentStatus.replace(/_/g, " ").toLowerCase()} ·{" "}
                      {new Date(o.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
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
                    Loading orders…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center text-muted">
                    No orders match filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="align-top transition hover:bg-surface-muted/15">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 lg:px-4">
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

      <OrderDetailModal orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />
    </div>
  );
}
