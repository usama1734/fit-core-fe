export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50];

function buildMeta(page, pageSize, total) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Normalizes list API responses. Slices client-side when the server returns
 * an unpaginated array or more rows than pageSize (e.g. stale API process).
 */
export function parseListResponse(response, { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const rawItems = Array.isArray(response.data) ? response.data : [];
  let meta = response.meta;

  if (!meta) {
    const total = rawItems.length;
    const start = (page - 1) * pageSize;
    return {
      items: rawItems.slice(start, start + pageSize),
      meta: buildMeta(page, pageSize, total),
    };
  }

  const total = meta.total ?? rawItems.length;
  let items = rawItems;

  if (items.length > pageSize) {
    const start = ((meta.page ?? page) - 1) * pageSize;
    items = items.slice(start, start + pageSize);
  }

  return {
    items,
    meta: {
      page: meta.page ?? page,
      pageSize: meta.pageSize ?? pageSize,
      total,
      totalPages: meta.totalPages ?? buildMeta(page, pageSize, total).totalPages,
    },
  };
}
