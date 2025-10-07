import { useQuery } from "@tanstack/react-query";

import { fetchTeamInsights } from "../lib/apiFootball";

export const useTeamInsights = (teamName: string | null) =>
  useQuery({
    queryKey: ["team-insights", teamName],
    queryFn: () => {
      if (!teamName) {
        throw new Error("Не указано название команды");
      }
      return fetchTeamInsights(teamName);
    },
    enabled: Boolean(teamName),
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("Команда не найдена")) {
        return false;
      }
      return failureCount < 2;
    },
  });
