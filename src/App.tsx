import { useState } from "react";

import FixturesList from "./components/FixturesList";
import RecordChart from "./components/RecordChart";
import TeamSearchForm, { type TeamSearchFormValues } from "./components/TeamSearchForm";
import TeamSummary from "./components/TeamSummary";
import { useTeamInsights } from "./hooks/useTeamInsights";

const App: React.FC = () => {
  const [teamName, setTeamName] = useState<string | null>(null);
  const { data, isLoading, isError, error, isFetching } = useTeamInsights(teamName);

  const handleSubmit = ({ teamName: submittedTeam }: TeamSearchFormValues) => {
    setTeamName(submittedTeam.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pt-12 md:px-8">
        <header className="flex flex-col gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary-300/80">Wingo</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Статистика футбольных команд в один запрос
          </h1>
          <p className="text-sm text-slate-400 sm:text-base">
            Введите название команды на русском или английском, чтобы увидеть свежие результаты и ключевые метрики.
          </p>
        </header>

        <TeamSearchForm isLoading={isLoading || isFetching} onSubmit={handleSubmit} initialTeam={teamName ?? undefined} />

        {isError ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {(error as Error).message}
          </div>
        ) : null}

        {data ? (
          <main className="flex flex-col gap-8">
            <TeamSummary insights={data} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
              <FixturesList fixtures={data.fixtures} teamId={data.team.id} />
              <RecordChart wins={data.record.wins} draws={data.record.draws} losses={data.record.losses} />
            </div>
          </main>
        ) : !teamName ? (
          <div className="rounded-3xl border border-dashed border-slate-800/70 bg-slate-900/40 p-8 text-center text-slate-500">
            Начните с поиска команды, чтобы увидеть детальный разбор последних матчей.
          </div>
        ) : isLoading || isFetching ? (
          <div className="rounded-3xl border border-slate-900 bg-slate-900/60 p-8 text-center text-slate-400">
            Загружаем данные...
          </div>
        ) : null}

        <footer className="mt-6 text-center text-xs text-slate-500">
          Источник данных: API-FOOTBALL.
        </footer>
      </div>
    </div>
  );
};

export default App;
