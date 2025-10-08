import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_TOP_TEAM_LEAGUES,
  fetchTopTeams,
  type FetchTopTeamsOptions,
} from "../lib/apiFootball";

const DEFAULT_OPTIONS: FetchTopTeamsOptions = {
  leagues: DEFAULT_TOP_TEAM_LEAGUES,
  limitPerLeague: 6,
};

export const useTopTeams = (options?: FetchTopTeamsOptions) =>
  useQuery({
    queryKey: ["top-teams", options ?? DEFAULT_OPTIONS],
    queryFn: () => fetchTopTeams(options ?? DEFAULT_OPTIONS),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
