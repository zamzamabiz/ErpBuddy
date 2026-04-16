// Pagination Utility
function getPagination(page = 1, limit = 20) {
  page = Math.max(1, parseInt(page));
  limit = Math.max(1, parseInt(limit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = getPagination;
