"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CrewDatum = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  members: number;
  capacity: number;
};

const INK = "#3b2a20";
const CLAY = "#8a6a54";
const GRID = "rgba(59, 42, 32, 0.08)";

const tooltipStyle = {
  backgroundColor: "#fffdf7",
  border: "1px solid rgba(59,42,32,0.15)",
  borderRadius: 8,
  fontSize: 13,
  color: INK,
};

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl bg-white/80 p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mb-3 text-sm text-clay">{sub}</p>
      {children}
    </section>
  );
}

type Pulse = {
  fetchedAt: string;
  source: "live" | "snapshot";
  categories: { service: string; count: number; groupId?: string }[];
  hotspots: {
    label: string;
    groupId: string;
    neighborhoods: { name: string; count: number }[];
  }[];
};

export function DashboardCharts({
  crewData,
  interests,
  pulse,
}: {
  crewData: CrewDatum[];
  interests: { tag: string; count: number }[];
  pulse: Pulse;
}) {
  const byMembers = [...crewData]
    .sort((a, b) => b.members - a.members)
    .map((d) => ({ ...d, fill: d.color }));
  const crewLabel = (id: unknown) => {
    const c = crewData.find((d) => d.id === id);
    return c
      ? `${c.emoji} ${c.name.replace(/ (Crew|Squad|Team|Circle|Collective|Allies)$/, "")}`
      : String(id);
  };

  return (
    <>
      <Card
        title="Neighbors per crew"
        sub="Where people landed after chatting with Charly."
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byMembers} layout="vertical" margin={{ left: 8, right: 32 }}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="id"
              width={170}
              tickFormatter={crewLabel}
              tick={{ fill: INK, fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgba(59,42,32,0.04)" }}
              formatter={(v) => [`${v} neighbors`, ""]}
              labelFormatter={crewLabel}
            />
            <Bar dataKey="members" barSize={16} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="members" position="right" fill={INK} fontSize={13} fontWeight={700} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title="Volunteer supply vs. partner capacity"
        sub="Crews vs. how many volunteers their partner orgs can absorb — the gap is the opportunity."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={crewData} margin={{ right: 8 }} barGap={2}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="id"
              tickFormatter={(id: string) => crewData.find((d) => d.id === id)?.emoji ?? id}
              tick={{ fontSize: 18 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: CLAY, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgba(59,42,32,0.04)" }}
              labelFormatter={crewLabel}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: INK, fontSize: 13 }}>
                  {value === "members" ? "Crew members" : "Org capacity"}
                </span>
              )}
            />
            <Bar dataKey="members" name="members" fill="#e5543f" barSize={14} radius={[4, 4, 0, 0]} />
            <Bar dataKey="capacity" name="capacity" fill="#8a6a54" barSize={14} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title="City pulse — where SF needs hands"
        sub={`${pulse.source === "live" ? "Live from DataSF" : "DataSF snapshot"} (SF311 reports, last 30 days), colored by the crew that can act on them.`}
      >
        <ResponsiveContainer width="100%" height={Math.max(160, pulse.categories.length * 36)}>
          <BarChart
            data={pulse.categories.map((c) => ({
              ...c,
              fill: crewData.find((d) => d.id === c.groupId)?.color ?? CLAY,
            }))}
            layout="vertical"
            margin={{ left: 8, right: 48 }}
          >
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="service"
              width={210}
              tick={{ fill: INK, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgba(59,42,32,0.04)" }}
              formatter={(v) => [`${Number(v).toLocaleString()} reports`, ""]}
            />
            <Bar dataKey="count" barSize={14} radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="count"
                position="right"
                fill={INK}
                fontSize={12}
                fontWeight={700}
                formatter={(v) => Number(v).toLocaleString()}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-1 border-t border-ink/10 pt-3">
          {pulse.hotspots.map((h) => (
            <p key={h.label} className="text-sm">
              <span
                className="font-bold"
                style={{ color: crewData.find((d) => d.id === h.groupId)?.color ?? INK }}
              >
                {h.label}:
              </span>{" "}
              <span className="text-clay">
                {h.neighborhoods.map((n) => `${n.name} (${n.count.toLocaleString()})`).join(" · ")}
              </span>
            </p>
          ))}
          <p className="pt-1 text-xs text-clay">
            Source: data.sfgov.org — these numbers also feed the planner agent&apos;s action plans.
          </p>
        </div>
      </Card>

      <Card title="What people care about" sub="Most common interests Charly heard in onboarding chats.">
        <ResponsiveContainer width="100%" height={Math.max(160, interests.length * 34)}>
          <BarChart data={interests} layout="vertical" margin={{ left: 8, right: 32 }}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="tag"
              width={150}
              tick={{ fill: INK, fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "rgba(59,42,32,0.04)" }}
              formatter={(v) => [`${v} neighbors`, ""]}
            />
            <Bar dataKey="count" barSize={14} radius={[0, 4, 4, 0]} fill="#8a6a54">
              <LabelList dataKey="count" position="right" fill={INK} fontSize={13} fontWeight={700} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}
