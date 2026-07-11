// Live civic signals from DataSF (SF311 cases, dataset vw6y-z8j6) via the
// public SODA API — no key needed. Used two ways:
//  1. the Community board renders the "city pulse" so crews see real need
//  2. the planner agent gets the numbers inline so action plans cite them
import snapshot from "../../data/sf311-snapshot.json";

const SODA = "https://data.sfgov.org/resource/vw6y-z8j6.json";

// 311 categories that map to a Charly crew (everything else is city ops noise)
const SERVICE_TO_GROUP: Record<string, string> = {
  "Street and Sidewalk Cleaning": "environment",
  "Graffiti Public": "environment",
  "Graffiti Private": "environment",
  "Tree Maintenance": "environment",
  "Litter Receptacle Maintenance": "environment",
  Encampment: "housing",
  "Blocked Street and Sidewalk": "housing",
  "Homeless Concerns": "housing",
};

export type CityPulse = {
  fetchedAt: string;
  source: "live" | "snapshot";
  categories: { service: string; count: number; groupId?: string }[];
  hotspots: {
    label: string;
    groupId: string;
    neighborhoods: { name: string; count: number }[];
  }[];
};

let cache: { pulse: CityPulse; at: number } | null = null;
const CACHE_MS = 30 * 60 * 1000;

async function soda(params: string): Promise<Record<string, string>[]> {
  const res = await fetch(`${SODA}?${params}`, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`SODA ${res.status}`);
  return res.json();
}

export async function getCityPulse(): Promise<CityPulse> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.pulse;

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 19);
  const where = `requested_datetime>'${since}'`;
  try {
    const [cats, enc, clean] = await Promise.all([
      soda(
        `$select=service_name,count(*) as n&$group=service_name&$order=n DESC&$limit=20&$where=${where}`
      ),
      soda(
        `$select=neighborhoods_sffind_boundaries,count(*) as n&$group=neighborhoods_sffind_boundaries&$order=n DESC&$limit=4&$where=${where} AND service_name='Encampment'`
      ),
      soda(
        `$select=neighborhoods_sffind_boundaries,count(*) as n&$group=neighborhoods_sffind_boundaries&$order=n DESC&$limit=4&$where=${where} AND service_name='Street and Sidewalk Cleaning'`
      ),
    ]);

    const categories = cats
      .filter((c) => SERVICE_TO_GROUP[c.service_name])
      .map((c) => ({
        service: c.service_name,
        count: Number(c.n),
        groupId: SERVICE_TO_GROUP[c.service_name],
      }));

    const toHood = (rows: Record<string, string>[]) =>
      rows
        .filter((r) => r.neighborhoods_sffind_boundaries)
        .map((r) => ({ name: r.neighborhoods_sffind_boundaries, count: Number(r.n) }));

    const pulse: CityPulse = {
      fetchedAt: new Date().toISOString(),
      source: "live",
      categories,
      hotspots: [
        { label: "Encampment reports", groupId: "housing", neighborhoods: toHood(enc) },
        {
          label: "Street & sidewalk cleaning",
          groupId: "environment",
          neighborhoods: toHood(clean),
        },
      ],
    };
    cache = { pulse, at: Date.now() };
    return pulse;
  } catch (err) {
    console.warn("DataSF fetch failed, using snapshot:", err);
    const pulse = { ...(snapshot as CityPulse), source: "snapshot" as const };
    cache = { pulse, at: Date.now() };
    return pulse;
  }
}

// One-paragraph digest of the signals relevant to a crew, for the planner prompt.
export function pulseForGroup(pulse: CityPulse, groupId: string): string {
  const cats = pulse.categories.filter((c) => c.groupId === groupId);
  const spots = pulse.hotspots.filter((h) => h.groupId === groupId);
  if (!cats.length && !spots.length) return "";
  const catLine = cats
    .map((c) => `${c.service}: ${c.count.toLocaleString()} reports`)
    .join("; ");
  const spotLine = spots
    .map(
      (h) =>
        `${h.label} hotspots: ${h.neighborhoods.map((n) => `${n.name} (${n.count})`).join(", ")}`
    )
    .join(". ");
  return `Real city data (SF311, last 30 days): ${catLine}. ${spotLine}`.trim();
}
