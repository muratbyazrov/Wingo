import type { TeamInsights } from "../lib/apiFootball";

type TeamSummaryProps = {
  insights: TeamInsights;
};

const TeamSummary: React.FC<TeamSummaryProps> = ({ insights }) => {
  const { team, venue, record } = insights;
  const winRate = insights.fixtures.length
    ? Math.round((record.wins / insights.fixtures.length) * 100)
    : 0;

  return (
    <section className="grid grid-cols-1 gap-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-900/30 p-6 shadow-2xl shadow-primary-900/30 md:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <img src={team.logo} alt={team.name} className="h-16 w-16 rounded-xl bg-slate-800 p-2" />
            <div>
              <h2 className="text-2xl font-semibold text-white">{team.name}</h2>
              <p className="text-sm uppercase tracking-wider text-slate-400">
                {team.country}
                {team.founded ? ` • основан в ${team.founded}` : ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Победы</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-400">{record.wins}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Ничьи</p>
              <p className="mt-1 text-2xl font-semibold text-slate-300">{record.draws}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Поражения</p>
              <p className="mt-1 text-2xl font-semibold text-rose-400">{record.losses}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Разница мячей</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {record.goalsFor} : {record.goalsAgainst}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400">Winrate</p>
              <p className="mt-1 text-xl font-semibold text-primary-300">{winRate}%</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Стадион</h3>
        {venue ? (
          <>
            <p className="text-lg font-semibold text-white">{venue.name ?? "—"}</p>
            <p className="text-sm text-slate-400">{venue.city ?? "Город не указан"}</p>
            {venue.capacity ? (
              <p className="text-sm text-slate-400">Вместимость: {venue.capacity.toLocaleString()}</p>
            ) : null}
            {venue.surface ? (
              <p className="text-sm text-slate-400">Покрытие: {venue.surface}</p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">Информация о стадионе недоступна.</p>
        )}
      </div>
    </section>
  );
};

export default TeamSummary;
