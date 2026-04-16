import type { FilterFn } from "@tanstack/react-table";

/** Case-insensitive substring filter for column filter values. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- shared across admin tables with different row types
export const includesStringFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const q = String(filterValue ?? "").trim().toLowerCase();
  if (!q) return true;
  const raw = row.getValue(columnId);
  return String(raw ?? "")
    .toLowerCase()
    .includes(q);
};
