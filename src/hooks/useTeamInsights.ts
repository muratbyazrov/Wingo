import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_TEAM_INSIGHTS_FILTERS,
  fetchTeamInsights,
  type TeamInsightsFilters,
} from "../lib/apiFootball";

export const useTeamInsights = (
  teamName: string | null,
  filters: TeamInsightsFilters = DEFAULT_TEAM_INSIGHTS_FILTERS,
) =>
  useQuery({
    queryKey: ["team-insights", teamName, filters],
    queryFn: () => {
      if (!teamName) {
        throw new Error("Не указано название команды");
      }
      return fetchTeamInsights(teamName, filters);
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
