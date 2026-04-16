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
import { RefreshCw, Search } from "lucide-react";
import { includesStringFilter } from "@/lib/admin-table-filters";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
};

const col = createColumnHelper<AdminUserRow>();

const userGlobalFilter: FilterFn<AdminUserRow> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "").trim().toLowerCase();
  if (!q) return true;
  const u = row.original;
  const blob = [u.email, u.name ?? "", u.phone ?? "", u.role, String(u.orderCount)].join(" ").toLowerCase();
  return blob.includes(q);
};

export function AdminUsersClient() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await fetch("/api/admin/users");
    if (!r.ok) {
      setError(r.status === 401 ? "Unauthorized." : "Could not load users.");
      setRows([]);
      setLoading(false);
      return;
    }
    const j = (await r.json()) as { users: AdminUserRow[] };
    setRows(j.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    () => [
      col.accessor("email", {
        header: "Email",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => <span className="font-medium text-foreground">{c.getValue()}</span>,
      }),
      col.accessor("name", {
        header: "Name",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => <span className="text-muted">{c.getValue() ?? "—"}</span>,
      }),
      col.accessor("role", {
        header: "Role",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              c.getValue() === "ADMIN" ? "bg-primary/12 text-primary" : "bg-muted/25 text-muted"
            }`}
          >
            {c.getValue()}
          </span>
        ),
      }),
      col.accessor("orderCount", {
        header: () => <span className="block text-right">Orders</span>,
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: (c) => <span className="block text-right tabular-nums text-foreground">{c.getValue()}</span>,
      }),
      col.accessor((row) => new Date(row.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }), {
        id: "joinedDisplay",
        header: "Joined",
        enableColumnFilter: true,
        filterFn: includesStringFilter,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted">
            {new Date(row.original.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
          </span>
        ),
      }),
    ],
    [],
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
    initialState: { pagination: { pageSize: 15 } },
    globalFilterFn: userGlobalFilter,
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Accounts stored in Postgres. Roles control who can open this admin area.
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
              placeholder="Search email, name, role…"
              className="w-full rounded-xl border border-black/10 bg-surface-muted/30 py-2.5 pl-10 pr-3 text-sm outline-none ring-ring/25 focus:ring-4"
            />
          </div>
          <p className="text-xs text-muted">
            {table.getFilteredRowModel().rows.length} of {rows.length} users
          </p>
        </div>

        <div className="md:hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted">Loading users…</p>
          ) : pageRows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No users match filters.</p>
          ) : (
            <div className="space-y-3 p-4">
              {pageRows.map((row, i) => {
                const u = row.original;
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.28), duration: 0.3 }}
                    className="rounded-2xl border border-black/8 bg-surface-muted/15 p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 break-all font-semibold text-foreground">{u.email}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.role === "ADMIN" ? "bg-primary/12 text-primary" : "bg-muted/25 text-muted"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{u.name ?? "—"}</p>
                    <p className="mt-2 text-xs text-muted">
                      {u.orderCount} orders · joined{" "}
                      {new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
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
                    Loading users…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center text-muted">
                    No users match filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-surface-muted/15">
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
    </div>
  );
}
