import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

export function useRolesUrlState() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(20));
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''));
  
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString);
  const [sortOrder, setSortOrder] = useQueryState<'asc' | 'desc'>('sortOrder', {
    parse: (value) => (value === 'asc' || value === 'desc' ? value : null),
  });

  const queryParams = {
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
  };

  const setFilters = (filters: { status?: string }) => {
    setStatus(filters.status || null);
    setPage(1); // Reset page on filter change
  };

  return {
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSearch,
    setSortBy,
    setSortOrder,
    setFilters,
    queryParams,
  };
}
