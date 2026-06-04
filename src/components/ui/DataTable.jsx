import { useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../api/pagination.js';
import Pagination from './Pagination.jsx';

export default function DataTable({
  columns,
  data,
  keyField = 'id',
  emptyMessage = 'No records found',
  onRowClick,
  mobileRender,
  pagination,
  paginateLocally = false,
  defaultPageSize = DEFAULT_PAGE_SIZE,
}) {
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(defaultPageSize);

  const isServerPagination = Boolean(pagination?.onPageChange);
  const isLocalPagination = paginateLocally && !isServerPagination;

  const displayData = useMemo(() => {
    if (!data?.length) return [];
    if (isLocalPagination) {
      const start = (localPage - 1) * localPageSize;
      return data.slice(start, start + localPageSize);
    }
    if (isServerPagination) {
      const { page, pageSize } = pagination;
      if (data.length <= pageSize) return data;
      const start = (page - 1) * pageSize;
      return data.slice(start, start + pageSize);
    }
    return data;
  }, [data, isServerPagination, isLocalPagination, localPage, localPageSize, pagination]);

  const localMeta = useMemo(() => {
    const total = data?.length ?? 0;
    const pageSize = localPageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { page: localPage, pageSize, total, totalPages };
  }, [data, localPage, localPageSize]);

  if (!data?.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-12 text-center text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  const activeMeta = isServerPagination
    ? {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
      }
    : isLocalPagination
      ? localMeta
      : null;

  const tableBody = (
    <>
      <div className="hidden overflow-x-auto md:block">
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
            {displayData.map((row) => (
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
        {displayData.map((row) =>
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

  const paginationProps = isServerPagination
    ? {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: pagination.totalPages,
        onPageChange: pagination.onPageChange,
        onPageSizeChange: pagination.onPageSizeChange,
      }
    : isLocalPagination
      ? {
          page: localMeta.page,
          pageSize: localMeta.pageSize,
          total: localMeta.total,
          totalPages: localMeta.totalPages,
          onPageChange: setLocalPage,
          onPageSizeChange: (size) => {
            setLocalPageSize(size);
            setLocalPage(1);
          },
        }
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
      {tableBody}
      {paginationProps && activeMeta.total > 0 && <Pagination {...paginationProps} />}
    </div>
  );
}
