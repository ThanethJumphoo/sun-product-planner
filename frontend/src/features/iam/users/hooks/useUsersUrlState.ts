import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { GetUsersQuery } from '../api/users.service';

export function useUsersUrlState() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(20));
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''));
  const [authProvider, setAuthProvider] = useQueryState('authProvider', parseAsString.withDefault(''));
  const [roleId, setRoleId] = useQueryState('roleId', parseAsInteger);
  
  // Sorting is usually managed by AG Grid natively, but we can sync it if needed.
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString);
  const [sortOrder, setSortOrder] = useQueryState<'asc' | 'desc'>('sortOrder', {
    parse: (value) => (value === 'asc' || value === 'desc' ? value : null),
  });

  const queryParams: GetUsersQuery = {
    page,
    limit,
    search: search || undefined,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
    // Add additional fields to the API query object if the backend supports them
  };

  const setFilters = (filters: { status?: string; authProvider?: string; roleId?: number }) => {
    setStatus(filters.status || null);
    setAuthProvider(filters.authProvider || null);
    if (filters.roleId !== undefined) {
      setRoleId(filters.roleId);
    } else {
      setRoleId(null);
    }
    setPage(1); // Reset page on filter change
  };

  return {
    page,
    limit,
    search,
    status,
    authProvider,
    roleId,
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
