import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  teamName: z
    .string({ required_error: "Введите название команды" })
    .min(2, "Минимум 2 символа")
    .max(50, "Слишком длинное название"),
});

export type TeamSearchFormValues = z.infer<typeof schema>;

type TeamSearchFormProps = {
  isLoading: boolean;
  onSubmit: (values: TeamSearchFormValues) => void;
  initialTeam?: string;
};

const TeamSearchForm: React.FC<TeamSearchFormProps> = ({
  onSubmit,
  isLoading,
  initialTeam,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamSearchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { teamName: initialTeam ?? "" },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-4 rounded-2xl bg-slate-900/60 p-6 shadow-xl shadow-primary-900/20 backdrop-blur"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="teamName" className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Найти команду
        </label>
        <div className="relative flex items-center">
          <input
            id="teamName"
            {...register("teamName")}
            placeholder="Например, Zenit или Real Madrid"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-base font-medium text-slate-100 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/60"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Загрузка..." : "Искать"}
          </button>
        </div>
        {errors.teamName ? (
          <p className="text-sm text-red-400">{errors.teamName.message}</p>
        ) : (
          <p className="text-sm text-slate-500">
            Поддерживаются английские и русские названия. Источник данных: API-FOOTBALL.
          </p>
        )}
      </div>
    </form>
  );
};

export default TeamSearchForm;
