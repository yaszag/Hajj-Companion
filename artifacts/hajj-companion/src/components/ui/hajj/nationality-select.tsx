import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomDrawer } from "./bottom-drawer";
import { buildNationalityList, getCountryByCode, type CountryOption } from "./countries-ar";

export interface HajjNationalitySelectProps {
  label?: string;
  value: string;
  onChange: (iso2: string) => void;
  error?: string;
  disabled?: boolean;
}

export function HajjNationalitySelect({
  label = "الجنسية",
  value,
  onChange,
  error,
  disabled,
}: HajjNationalitySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const { pinned, rest } = React.useMemo(() => buildNationalityList(), []);

  const selected = value ? getCountryByCode(value) : undefined;

  const filterList = React.useCallback(
    (list: CountryOption[]) => {
      const t = q.trim().toLowerCase();
      if (!t) return list;
      return list.filter(
        (c) => c.nameAr.includes(q.trim()) || c.code.toLowerCase().includes(t),
      );
    },
    [q],
  );

  const pinnedF = filterList(pinned);
  const restF = filterList(rest);

  const row = (c: CountryOption) => (
    <button
      key={c.code}
      type="button"
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-right text-base transition-colors hover:bg-primary-light",
        value === c.code && "bg-primary-light",
      )}
      onClick={() => {
        onChange(c.code);
        setOpen(false);
        setQ("");
      }}
    >
      <span className="text-2xl" aria-hidden>
        {c.flag}
      </span>
      <span className="flex-1 font-medium text-foreground">{c.nameAr}</span>
    </button>
  );

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={cn(
          "flex min-h-[52px] w-full items-center justify-between rounded-card border-2 bg-surface px-3 py-2 text-right transition-all duration-200",
          error ? "border-rukn" : "border-border focus-visible:border-primary focus-visible:shadow-focus",
          disabled && "opacity-60",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="text-muted-foreground">▼</span>
        <span className="flex flex-1 flex-col items-end gap-0.5">
          <span className="text-xs text-primary">{label}</span>
          {selected ? (
            <span className="text-base font-semibold text-foreground">
              {selected.flag} {selected.nameAr}
            </span>
          ) : (
            <span className="text-base text-muted-foreground">اختر جنسيتك</span>
          )}
        </span>
      </button>
      {error ? (
        <p role="alert" className="mt-1 animate-slide-down text-xs text-rukn">
          {error}
        </p>
      ) : null}

      <BottomDrawer open={open} onOpenChange={setOpen} title="اختر جنسيتك">
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-3 pb-2 pt-1">
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم أو الرمز..."
              className="h-11 w-full rounded-card border border-border bg-surface2 pe-10 ps-3 text-right text-sm outline-none focus:border-primary"
              aria-label="بحث عن دولة"
            />
          </div>
        </div>
        <div className="pb-4">
          {pinnedF.length > 0 ? (
            <>
              <p className="px-4 py-2 text-xs font-bold text-muted-foreground">الأكثر شيوعاً</p>
              <div className="flex flex-col">{pinnedF.map(row)}</div>
            </>
          ) : null}
          {restF.length > 0 ? (
            <>
              <p className="px-4 py-2 text-xs font-bold text-muted-foreground">كل الدول</p>
              <div className="flex flex-col">{restF.map(row)}</div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">لا نتائج</p>
          )}
        </div>
      </BottomDrawer>
    </div>
  );
}
