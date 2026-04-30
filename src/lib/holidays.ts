export interface Holiday {
  name: string;
  date: string;
  observed: string;
  federal: boolean;
  type: "public" | "bank" | "optional";
}

const UK_HOLIDAYS_API = "https://www.gov.uk/bank-holidays.json";

const cache = new Map<string, { holidays: Holiday[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchUKHolidays(): Promise<Holiday[]> {
  const cacheKey = "uk";
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.holidays;
  }

  try {
    const response = await fetch(UK_HOLIDAYS_API, {
      next: { revalidate: CACHE_TTL / 1000 },
    });

    if (!response.ok) {
      console.error(`UK Holidays API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data["england-and-wales"]?.events || [];

    const holidays: Holiday[] = events.map((h: {
      title?: string;
      date?: string;
      notes?: string;
    }) => ({
      name: h.title || "",
      date: h.date || "",
      observed: h.date || "",
      federal: true,
      type: "bank" as const,
    }));

    cache.set(cacheKey, { holidays, timestamp: Date.now() });
    return holidays;
  } catch (error) {
    console.error("Failed to fetch UK holidays:", error);
    return [];
  }
}

export async function getHolidaysForYear(
  countryCode: string,
  year: number
): Promise<Holiday[]> {
  const normalizedCountry = countryCode?.toUpperCase();

  if (normalizedCountry === "GB") {
    return fetchUKHolidays();
  }

  return [];
}

export async function getHolidaysForDateRange(
  countryCode: string,
  startDate: Date,
  endDate: Date
): Promise<Holiday[]> {
  const holidays = await getHolidaysForYear(countryCode, startDate.getFullYear());

  return holidays.filter((h) => {
    const holidayDate = new Date(h.date);
    return holidayDate >= startDate && holidayDate <= endDate;
  });
}

export function isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
  const dateKey = date.toISOString().split("T")[0];

  return (
    holidays.find((h) => h.date.split("T")[0] === dateKey) || null
  );
}