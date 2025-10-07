import { format } from "date-fns";
import { ru } from "date-fns/locale";

import type { FixtureResponse } from "../lib/apiFootball";

type FixturesListProps = {
  fixtures: FixtureResponse[];
  teamId: number;
};

const FixturesList: React.FC<FixturesListProps> = ({ fixtures, teamId }) => {
  if (fixtures.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-800/80 bg-slate-900/40 p-6 text-center text-slate-500">
        Нет данных о последних матчах.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-inner shadow-primary-950/40">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Последние матчи</h3>
          <p className="text-sm text-slate-400">Свежие результаты (до 10 игр)</p>
        </div>
        <span className="rounded-full bg-primary-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-200">
          {fixtures.length}
        </span>
      </header>
      <ul className="flex flex-col gap-4">
        {fixtures.map((fixture) => {
          const isHome = fixture.teams.home.id === teamId;
          const opponent = isHome ? fixture.teams.away : fixture.teams.home;
          const teamGoals = isHome ? fixture.goals.home ?? 0 : fixture.goals.away ?? 0;
          const opponentGoals = isHome ? fixture.goals.away ?? 0 : fixture.goals.home ?? 0;
          const isWin = teamGoals > opponentGoals;
          const isDraw = teamGoals === opponentGoals;

          return (
            <li
              key={fixture.fixture.id}
              className="flex flex-col gap-2 rounded-2xl bg-slate-950/70 p-4 transition hover:bg-slate-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {isHome ? "Дома" : "В гостях"} против {opponent.name}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    {fixture.league.name} • {fixture.league.country}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                    isWin
                      ? "bg-emerald-500/20 text-emerald-300"
                      : isDraw
                      ? "bg-slate-500/20 text-slate-200"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {isWin ? "Победа" : isDraw ? "Ничья" : "Поражение"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                <p>
                  Счет: <span className="font-semibold text-slate-100">{teamGoals}</span> :
                  <span className="font-semibold text-slate-100"> {opponentGoals}</span>
                </p>
                <p>
                  {format(new Date(fixture.fixture.date), "d MMMM yyyy, HH:mm", { locale: ru })}
                </p>
                {fixture.fixture.venue?.name ? (
                  <p className="flex items-center gap-1">
                    <span className="text-slate-500">🏟</span>
                    {fixture.fixture.venue.name}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FixturesList;
