export default function DataTable({
  columns,
  data,
  keyField = 'id',
  emptyMessage = 'No records found',
  onRowClick,
  mobileRender,
}) {
  if (!data?.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-12 text-center text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {data.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick?.(row)}
                className={`bg-slate-900/40 transition hover:bg-slate-800/60 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-200">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {data.map((row) =>
          mobileRender ? (
            mobileRender(row)
          ) : (
            <div
              key={row[keyField]}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between gap-2 py-1 text-sm">
                  <span className="text-slate-500">{col.label}</span>
                  <span className="text-right text-slate-200">
                    {col.render ? col.render(row) : row[col.key]}
                  </span>
                </div>
              ))}
            </div>
          ),
        )}
      </div>
    </>
  );
}
