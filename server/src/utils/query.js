const normalizeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePagination = (query, allowedSortFields = ["createdAt"], defaultSortBy = "createdAt") => {
  const page = normalizeNumber(query.page, 1);
  const limit = Math.min(normalizeNumber(query.limit, 10), 50);
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : defaultSortBy;
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    sortOrder,
  };
};

const buildSearchFilter = (value) => {
  if (!value) {
    return undefined;
  }

  return {
    contains: value.trim(),
  };
};

const buildPaginatedResponse = (items, total, pagination) => ({
  items,
  meta: {
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1,
  },
});

module.exports = {
  parsePagination,
  buildSearchFilter,
  buildPaginatedResponse,
};
