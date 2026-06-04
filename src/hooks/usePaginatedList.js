import { useCallback, useEffect, useState } from 'react';
import { getApiError } from '../api/client.js';
import { DEFAULT_PAGE_SIZE } from '../api/pagination.js';

export function usePaginatedList(fetchPage, deps = []) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchPage({ page, pageSize });
      setItems(result.items);
      setMeta(result.meta);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, page, pageSize, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  const setPageSizeAndReset = (size) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    items,
    meta,
    page,
    pageSize,
    setPage,
    setPageSize: setPageSizeAndReset,
    loading,
    error,
    setError,
    reload: load,
  };
}
