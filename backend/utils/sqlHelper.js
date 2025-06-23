/**
 * SQL Helper utilities for common database operations
 */

// Safely execute paginated queries by manually building the query
// This avoids parameter issues with LIMIT and OFFSET
const paginatedQuery = async (
  pool,
  baseQuery,
  params,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;

  // Build the query with LIMIT and OFFSET directly in string
  const finalQuery = `${baseQuery} LIMIT ${parseInt(limit)} OFFSET ${parseInt(
    offset
  )}`;

  // Execute the query with the provided parameters
  const [rows] = await pool.execute(finalQuery, params);

  return rows;
};

module.exports = {
  paginatedQuery,
};
