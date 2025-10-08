import { useEffect, useMemo, useState } from "react";

import FixturesList from "./FixturesList";
import RecordChart from "./RecordChart";
import TeamSummary from "./TeamSummary";
import { useTeamInsights } from "../hooks/useTeamInsights";
import { useTopTeams } from "../hooks/useTopTeams";
import { DEFAULT_TEAM_INSIGHTS_FILTERS } from "../lib/apiFootball";

const formatForm = (form: string | null) => {
  if (!form) {
    return "—";
  }

  return form
    .trim()
    .split("")
    .filter(Boolean)
    .slice(-5)
    .join(" ");
};

const TopTeamsTab: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const { data, isLoading, isFetching, isError, error } = useTopTeams();

  const filteredTeams = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalized = searchValue.trim().toLowerCase();

    if (!normalized) {
      return data;
    }

    return data.filter((item) => {
      const target = `${item.team.name} ${item.league.name} ${item.league.country}`.toLowerCase();
      return target.includes(normalized);
    });
  }, [data, searchValue]);

  useEffect(() => {
    if (!filteredTeams.length) {
      setSelectedTeamId(null);
      return;
    }

    if (!selectedTeamId || !filteredTeams.some((team) => team.team.id === selectedTeamId)) {
      setSelectedTeamId(filteredTeams[0].team.id);
    }
  }, [filteredTeams, selectedTeamId]);

  const selectedTeam = useMemo(
    () => filteredTeams.find((team) => team.team.id === selectedTeamId) ?? null,
    [filteredTeams, selectedTeamId],
  );

  const {
    data: selectedInsights,
    isLoading: isSelectedLoading,
    isFetching: isSelectedFetching,
    isError: isSelectedError,
    error: selectedError,
  } = useTeamInsights(selectedTeam?.team.name ?? null, DEFAULT_TEAM_INSIGHTS_FILTERS);

  const hasTeams = filteredTeams.length > 0;
  const tileBaseClasses =
    "flex flex-col gap-3 rounded-2xl border bg-slate-950/60 p-4 text-left transition hover:border-primary-500/40 hover:bg-slate-900/70";

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Топ команд по ведущим лигам</h2>
        <p className="text-sm text-slate-400">
          Быстро просмотрите лидеров европейских чемпионатов и перейдите к подробной статистике в один клик.
        </p>
        <div className="relative">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Поиск по названию или лиге"
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 py-3 pl-4 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest text-slate-500">
            Enter
          </span>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-800/60 bg-slate-900/40 p-4">
            {isLoading || isFetching ? (
              <p className="text-sm text-slate-400">Загружаем таблицу лидеров...</p>
            ) : !hasTeams ? (
              <p className="text-sm text-slate-500">Команды не найдены. Попробуйте изменить поисковый запрос.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredTeams.map((team) => {
                  const isActive = team.team.id === selectedTeamId;
                  return (
                    <button
                      key={`${team.league.id}-${team.team.id}`}
                      type="button"
                      onClick={() => setSelectedTeamId(team.team.id)}
                      className={`${tileBaseClasses} ${
                        isActive
                          ? "border-primary-500/60 shadow-lg shadow-primary-900/20"
                          : "border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 text-lg font-semibold text-primary-300">
                            {team.rank}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{team.team.name}</p>
                            <p className="text-xs uppercase tracking-widest text-slate-500">
                              {team.league.name} • {team.league.country}
                            </p>
                          </div>
                        </div>
                        <img src={team.team.logo} alt={team.team.name} className="h-8 w-8" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">Очки</p>
                          <p className="text-lg font-semibold text-primary-300">{team.points}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">Разница мячей</p>
                          <p className="text-lg font-semibold text-slate-200">{team.goalsDiff >= 0 ? `+${team.goalsDiff}` : team.goalsDiff}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">Матчей</p>
                          <p className="text-lg font-semibold text-slate-200">{team.played}</p>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">Форма</p>
                          <p className="text-lg font-semibold text-emerald-300">{formatForm(team.form)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6">
            {selectedTeam ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <img src={selectedTeam.team.logo} alt={selectedTeam.team.name} className="h-14 w-14 rounded-2xl bg-slate-900/70 p-2" />
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedTeam.team.name}</p>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      {selectedTeam.league.name} • {selectedTeam.league.country}
                    </p>
                    <p className="text-xs text-slate-400">Сезон {selectedTeam.league.season}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-950/60 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Текущее место</p>
                    <p className="text-2xl font-semibold text-primary-300">{selectedTeam.rank}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Очки</p>
                    <p className="text-2xl font-semibold text-white">{selectedTeam.points}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Победы / Ничьи / Поражения</p>
                    <p className="text-2xl font-semibold text-emerald-300">
                      {selectedTeam.wins} / {selectedTeam.draws} / {selectedTeam.losses}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Разница мячей</p>
                    <p className="text-2xl font-semibold text-slate-200">
                      {selectedTeam.goalsFor} : {selectedTeam.goalsAgainst}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Выберите команду, чтобы увидеть подробный разбор.</p>
            )}
          </div>

          {selectedTeam ? (
            isSelectedError ? (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                {(selectedError as Error).message}
              </div>
            ) : isSelectedLoading || isSelectedFetching ? (
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 text-sm text-slate-400">
                Загружаем подробную статистику...
              </div>
            ) : selectedInsights ? (
              <div className="flex flex-col gap-6">
                <TeamSummary insights={selectedInsights} />
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
                  <FixturesList fixtures={selectedInsights.fixtures} teamId={selectedInsights.team.id} />
                  <RecordChart
                    wins={selectedInsights.record.wins}
                    draws={selectedInsights.record.draws}
                    losses={selectedInsights.record.losses}
                  />
                </div>
              </div>
            ) : null
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default TopTeamsTab;
