import { type ChangeEvent, useMemo } from "react";

import type { TeamInsightsFilters } from "../lib/apiFootball";

type TeamFiltersProps = {
  availableSeasons: number[];
  filters: TeamInsightsFilters;
  onChange: (filters: TeamInsightsFilters) => void;
  isLoading?: boolean;
};

const TeamFilters = ({
  availableSeasons,
  filters,
  onChange,
  isLoading = false,
}: TeamFiltersProps) => {
  const seasonOptions = useMemo(
    () => [...availableSeasons].sort((a, b) => b - a),
    [availableSeasons],
  );

  const handleModeChange = (mode: TeamInsightsFilters["mode"]) => {
    if (mode === filters.mode) {
      return;
    }

    if (mode === "season") {
      const fallbackSeason = filters.season && seasonOptions.includes(filters.season)
        ? filters.season
        : seasonOptions[0] ?? null;
      onChange({ mode, season: fallbackSeason ?? null });
      return;
    }

    onChange({ mode, season: null });
  };

  const handleSeasonChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "") {
      onChange({ mode: "season", season: null });
      return;
    }
    const parsed = Number(value);
    onChange({ mode: "season", season: Number.isFinite(parsed) ? parsed : null });
  };

  const isSeasonMode = filters.mode === "season";
  const canSelectSeason = seasonOptions.length > 0;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { mode: "recent", label: "Последние матчи" },
            { mode: "season", label: "По сезону" },
            { mode: "all", label: "Все сезоны" },
          ] satisfies { mode: TeamInsightsFilters["mode"]; label: string }[]
        ).map(({ mode, label }) => {
          const isActive = filters.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              disabled={isLoading}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                isActive
                  ? "border-primary-400 bg-primary-500/15 text-primary-200 shadow-inner shadow-primary-900/40"
                  : "border-slate-700 text-slate-300 hover:border-primary-400/60 hover:text-primary-200"
              } ${isLoading ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {isSeasonMode ? (
        canSelectSeason ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Выберите сезон
            </label>
            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-100 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/60"
              value={filters.season ?? seasonOptions[0] ?? ""}
              onChange={handleSeasonChange}
              disabled={isLoading}
            >
              {seasonOptions.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Для этой команды не удалось получить список сезонов. Попробуйте другой режим фильтрации.
          </p>
        )
      ) : null}
      <p className="text-xs text-slate-500">
        Если статистика отображается нулями, выберите другой сезон или включите режим «Все сезоны», чтобы
        собрать данные за более длительный период.
      </p>
    </section>
  );
};

export default TeamFilters;
