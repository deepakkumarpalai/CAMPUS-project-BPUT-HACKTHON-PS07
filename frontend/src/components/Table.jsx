export default function Table({ columns, rows, empty = 'No records found.' }) {
  if (!rows?.length) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-500">{empty}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-16px_rgba(15,23,42,0.28)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#f4f2ec] text-[11px] uppercase tracking-[0.12em] text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3.5 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row._id || index} className="border-t border-slate-100 bg-white transition-colors hover:bg-[#fbfaf7]">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-top">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
