const API_BASE_URL =
  import.meta.env.VITE_API_FOOTBALL_URL ?? "/api/football";

const safeFetch = async (
  ...args: Parameters<typeof fetch>
): Promise<Response> => {
  try {
    return await fetch(...args);
  } catch (error) {
    throw new Error(
      "Не удалось подключиться к API. Проверьте интернет-соединение и настройки прокси.",
    );
  }
};

const getApiHeaders = () => {
  const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error(
      "API key is missing. Please set the VITE_API_FOOTBALL_KEY environment variable.",
    );
  }

  return {
    "x-apisports-key": apiKey,
    "x-apisports-host": "v3.football.api-sports.io",
  } satisfies HeadersInit;
};

export type FixtureResponse = {
  fixture: {
    id: number;
    date: string;
    venue?: {
      name?: string;
      city?: string;
    };
    status: {
      long: string;
      short: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    round?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

export type TeamSearchResponse = {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string;
    founded: number | null;
    national: boolean;
    logo: string;
  };
  venue?: {
    id: number | null;
    name: string | null;
    city: string | null;
    capacity: number | null;
    surface: string | null;
    image: string | null;
  };
};

export type TeamInsightsFilters = {
  mode: "recent" | "season" | "all";
  season?: number | null;
};

export const DEFAULT_TEAM_INSIGHTS_FILTERS: TeamInsightsFilters = {
  mode: "recent",
  season: null,
};

export type TeamInsights = {
  team: TeamSearchResponse["team"];
  venue?: TeamSearchResponse["venue"];
  fixtures: FixtureResponse[];
  record: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  filters: TeamInsightsFilters & { matchesCount: number };
  availableSeasons: number[];
};

const fetchFixtures = async (
  teamId: number,
  headers: HeadersInit,
  query: string,
) => {
  const fixturesResponse = await safeFetch(
    `${API_BASE_URL}/fixtures?team=${teamId}&${query}`,
    {
      headers,
    },
  );

  if (!fixturesResponse.ok) {
    throw new Error(`Failed to load fixtures: ${fixturesResponse.statusText}`);
  }

  const fixturesData: { response: FixtureResponse[] } = await fixturesResponse.json();
  return fixturesData.response ?? [];
};

export const fetchTeamInsights = async (
  teamName: string,
  filters: TeamInsightsFilters = DEFAULT_TEAM_INSIGHTS_FILTERS,
): Promise<TeamInsights> => {
  const headers = getApiHeaders();

  const searchResponse = await safeFetch(
    `${API_BASE_URL}/teams?search=${encodeURIComponent(teamName)}`,
    {
      headers,
    },
  );

  if (!searchResponse.ok) {
    throw new Error(`Failed to search for team: ${searchResponse.statusText}`);
  }

  const searchData: { response: TeamSearchResponse[] } = await searchResponse.json();

  if (!Array.isArray(searchData.response) || searchData.response.length === 0) {
    throw new Error("Команда не найдена. Попробуйте уточнить название.");
  }

  const matchedTeam = searchData.response[0];
  const teamId = matchedTeam.team.id;

  const seasonsResponse = await safeFetch(
    `${API_BASE_URL}/teams/seasons?team=${teamId}`,
    {
      headers,
    },
  );

  if (!seasonsResponse.ok) {
    throw new Error(`Failed to load seasons: ${seasonsResponse.statusText}`);
  }

  const seasonsData: { response: number[] } = await seasonsResponse.json();
  const availableSeasons = Array.isArray(seasonsData.response)
    ? [...seasonsData.response].sort((a, b) => b - a)
    : [];

  const { mode, season } = filters;

  let fixtures: FixtureResponse[] = [];
  let appliedSeason: number | null = null;

  if (mode === "season") {
    const preferredSeason = season ?? availableSeasons[0] ?? null;
    const seasonToLoad =
      preferredSeason && availableSeasons.includes(preferredSeason)
        ? preferredSeason
        : availableSeasons[0] ?? null;

    appliedSeason = seasonToLoad ?? null;

    if (seasonToLoad) {
      fixtures = await fetchFixtures(teamId, headers, `season=${seasonToLoad}`);
    } else {
      fixtures = await fetchFixtures(teamId, headers, "last=10");
    }
  } else if (mode === "all") {
    if (availableSeasons.length === 0) {
      fixtures = await fetchFixtures(teamId, headers, "last=10");
    } else {
      const fixturesBySeason: FixtureResponse[][] = [];

      for (const seasonYear of availableSeasons) {
        const seasonFixtures = await fetchFixtures(teamId, headers, `season=${seasonYear}`);
        fixturesBySeason.push(seasonFixtures);
      }

      fixtures = fixturesBySeason.flat();
      fixtures.sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
    }
    appliedSeason = null;
  } else {
    fixtures = await fetchFixtures(teamId, headers, "last=10");
    appliedSeason = null;
  }

  const record = fixtures.reduce(
    (acc, fixture) => {
      const { goals } = fixture;
      const homeGoals = goals.home ?? 0;
      const awayGoals = goals.away ?? 0;

      if (fixture.teams.home.id === teamId) {
        if (homeGoals > awayGoals) acc.wins += 1;
        else if (homeGoals === awayGoals) acc.draws += 1;
        else acc.losses += 1;
        acc.goalsFor += homeGoals;
        acc.goalsAgainst += awayGoals;
      } else {
        if (awayGoals > homeGoals) acc.wins += 1;
        else if (awayGoals === homeGoals) acc.draws += 1;
        else acc.losses += 1;
        acc.goalsFor += awayGoals;
        acc.goalsAgainst += homeGoals;
      }

      return acc;
    },
    { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
  );

  return {
    team: matchedTeam.team,
    venue: matchedTeam.venue ?? undefined,
    fixtures,
    record,
    filters: {
      mode,
      season: appliedSeason,
      matchesCount: fixtures.length,
    },
    availableSeasons,
  };
};
