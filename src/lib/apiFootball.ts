const API_BASE_URL = "https://v3.football.api-sports.io";

const getApiHeaders = () => {
  const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error(
      "API key is missing. Please set the VITE_API_FOOTBALL_KEY environment variable.",
    );
  }

  return {
    Accept: "application/json",
    "x-apisports-key": apiKey,
  } satisfies HeadersInit;
};

const withNetworkGuard = async <T>(request: () => Promise<T>): Promise<T> => {
  try {
    return await request();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Не удалось связаться с API-FOOTBALL. Проверьте подключение к интернету, корректность ключа и настройки CORS.",
      );
    }
    throw error;
  }
};

const extractApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.clone().json()) as {
      message?: string;
      errors?: unknown;
    };

    if (payload?.message) {
      return payload.message;
    }

    if (payload?.errors) {
      const { errors } = payload;

      if (Array.isArray(errors)) {
        return errors.join(", ");
      }

      if (typeof errors === "string") {
        return errors;
      }

      if (typeof errors === "object" && errors !== null) {
        const rawValues = Object.values(errors as Record<string, unknown>);
        const values: string[] = [];

        for (const value of rawValues) {
          if (Array.isArray(value)) {
            values.push(...value.filter((item): item is string => typeof item === "string"));
          } else if (typeof value === "string") {
            values.push(value);
          }
        }

        if (values.length > 0) {
          return values.join(", ");
        }
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      try {
        const text = await response.clone().text();
        if (text) {
          return text;
        }
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  return fallback;
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
};

export const fetchTeamInsights = async (teamName: string): Promise<TeamInsights> => {
  const headers = getApiHeaders();

  const searchResponse = await withNetworkGuard(() =>
    fetch(`${API_BASE_URL}/teams?search=${encodeURIComponent(teamName)}`, {
      headers,
      mode: "cors",
    }),
  );

  if (!searchResponse.ok) {
    const message = await extractApiErrorMessage(
      searchResponse,
      `Failed to search for team: ${searchResponse.status} ${searchResponse.statusText}`,
    );
    throw new Error(message);
  }

  const searchData: { response: TeamSearchResponse[] } = await searchResponse.json();

  if (!Array.isArray(searchData.response) || searchData.response.length === 0) {
    throw new Error("Команда не найдена. Попробуйте уточнить название.");
  }

  const matchedTeam = searchData.response[0];
  const teamId = matchedTeam.team.id;

  const fixturesResponse = await withNetworkGuard(() =>
    fetch(`${API_BASE_URL}/fixtures?team=${teamId}&last=10`, {
      headers,
      mode: "cors",
    }),
  );

  if (!fixturesResponse.ok) {
    const message = await extractApiErrorMessage(
      fixturesResponse,
      `Failed to load fixtures: ${fixturesResponse.status} ${fixturesResponse.statusText}`,
    );
    throw new Error(message);
  }

  const fixturesData: { response: FixtureResponse[] } = await fixturesResponse.json();
  const fixtures = fixturesData.response ?? [];

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
  };
};
