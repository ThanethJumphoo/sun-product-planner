import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { useCallback } from 'react';

export function useChickenYieldsUrlState() {
  const [page, setPageQuery] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit, setLimitQuery] = useQueryState('limit', parseAsInteger.withDefault(50));
  const [search, setSearchQuery] = useQueryState('search', parseAsString);
  const [status, setStatusQuery] = useQueryState('status', parseAsString);

  const setPage = useCallback((newPage: number) => setPageQuery(newPage), [setPageQuery]);
  const setLimit = useCallback((newLimit: number) => setLimitQuery(newLimit), [setLimitQuery]);
  const setSearch = useCallback(
    (newSearch: string | null) => {
      setSearchQuery(newSearch);
      setPage(1); // Reset to page 1 on search
    },
    [setSearchQuery, setPage]
  );
  
  const setFilters = useCallback(
    (filters: { status?: string }) => {
      setStatusQuery(filters.status || null);
      setPage(1);
    },
    [setStatusQuery, setPage]
  );

  return {
    page,
    limit,
    search,
    status,
    setPage,
    setLimit,
    setSearch,
    setFilters,
    queryParams: {
      page,
      limit,
      search: search || undefined,
      status: status || undefined,
    },
  };
}
