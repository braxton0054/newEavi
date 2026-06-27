"use client";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthDate {
  month: string;
  startDate: string;
  endDate: string;
}

interface Props {
  year: number;
  dates: MonthDate[];
  onChange: (dates: MonthDate[]) => void;
}

export default function ReportingDatesEditor({ year, dates, onChange }: Props) {
  function getMonthDate(month: string) {
    return dates.find(d => d.month === month) || { month, startDate: "", endDate: "" };
  }

  function setMonthDate(month: string, field: "startDate" | "endDate", value: string) {
    const existing = getMonthDate(month);
    const updated = { ...existing, [field]: value };
    const others = dates.filter(d => d.month !== month);
    onChange([...others, updated].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)));
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {MONTHS.map(month => {
        const md = getMonthDate(month);
        return (
          <div key={month} className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">{month} {year}</p>
            <div className="space-y-1.5">
              <div>
                <label className="block text-[10px] text-gray-500">Report Start</label>
                <input
                  type="date"
                  value={md.startDate}
                  onChange={e => setMonthDate(month, "startDate", e.target.value)}
                  className="w-full rounded border border-gray-300 px-1.5 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500">Report End</label>
                <input
                  type="date"
                  value={md.endDate}
                  onChange={e => setMonthDate(month, "endDate", e.target.value)}
                  className="w-full rounded border border-gray-300 px-1.5 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
