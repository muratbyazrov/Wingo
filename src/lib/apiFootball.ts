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

  const transliterate = (source: string): string => {
    const map: Record<string, string> = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "kh",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "shch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
    };

    return source
      .split("")
      .map((char) => {
        const lower = char.toLowerCase();
        const replacement = map[lower];

        if (!replacement) {
          return char;
        }

        return lower === char ? replacement : replacement.charAt(0).toUpperCase() + replacement.slice(1);
      })
      .join("");
  };

  const searchTeam = async (query: string) => {
    const response = await safeFetch(`${API_BASE_URL}/teams?search=${encodeURIComponent(query)}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to search for team: ${response.statusText}`);
    }

    const data: { response: TeamSearchResponse[] } = await response.json();
    return Array.isArray(data.response) ? data.response : [];
  };

  let searchResults = await searchTeam(teamName);

  if (searchResults.length === 0 && /[А-Яа-яЁё]/.test(teamName)) {
    const transliterated = transliterate(teamName);
    if (transliterated.trim() && transliterated !== teamName) {
      searchResults = await searchTeam(transliterated);
    }
  }

  if (searchResults.length === 0) {
    throw new Error("Команда не найдена. Попробуйте уточнить название.");
  }

  const matchedTeam = searchResults[0];
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

  const seasonAvailability: Array<{ season: number; hasFixtures: boolean }> = [];
  const seasonFixturesCache = new Map<number, FixtureResponse[]>();

  for (const seasonYear of availableSeasons) {
    const fixturesForSeason = await fetchFixtures(teamId, headers, `season=${seasonYear}`);
    seasonFixturesCache.set(seasonYear, fixturesForSeason);
    seasonAvailability.push({ season: seasonYear, hasFixtures: fixturesForSeason.length > 0 });
  }

  const filteredSeasons = seasonAvailability
    .filter(({ hasFixtures }) => hasFixtures)
    .map(({ season }) => season);

  const { mode, season } = filters;

  let fixtures: FixtureResponse[] = [];
  let appliedSeason: number | null = null;

  if (mode === "season") {
    const preferredSeason = season ?? filteredSeasons[0] ?? null;
    const seasonToLoad =
      preferredSeason && filteredSeasons.includes(preferredSeason)
        ? preferredSeason
        : filteredSeasons[0] ?? null;

    appliedSeason = seasonToLoad ?? null;

    if (seasonToLoad) {
      fixtures = seasonFixturesCache.get(seasonToLoad) ?? [];
    } else {
      fixtures = await fetchFixtures(teamId, headers, "last=10");
    }
  } else if (mode === "all") {
    if (filteredSeasons.length === 0) {
      fixtures = await fetchFixtures(teamId, headers, "last=10");
    } else {
      const fixturesBySeason: FixtureResponse[][] = [];

      for (const seasonYear of filteredSeasons) {
        const seasonFixtures = seasonFixturesCache.get(seasonYear) ?? [];
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
    availableSeasons: filteredSeasons,
  };
};
