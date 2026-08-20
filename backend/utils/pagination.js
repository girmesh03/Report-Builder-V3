/**
 * @module utils/pagination
 *
 * The §27.6 pagination helper (ADR-034): a thin wrapper over
 * `mongoose-paginate-v2` (the plugin is applied on every model,
 * §27/D1) that owns the defaulting and clamping policy — page
 * defaults to `PAGINATION_DEFAULT_PAGE` (1), limit to
 * `PAGINATION_DEFAULT_LIMIT` (10) and is clamped to
 * `PAGINATION_MAX_LIMIT` (100) — and maps the plugin output to the
 * §27.4 paginated-list shape `{ docs, page, limit, totalDocs,
 * totalPages }`. Validation of invalid `page`/`limit` (non-positive,
 * non-numeric) happens in the §29 rule chains before this helper —
 * never here. `docs` are full documents (the ADR-017 transform layer
 * consumes the `toJSON` surface — Mongoose 9 has no built-in
 * lean-virtuals), mapped by the caller's per-domain DTO.
 */
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
} from './constants.js';

/**
 * Runs a paginated query and returns the §27.4 shape.
 * @param {import('mongoose').Model} model - The model to paginate.
 * @param {object} query - The filtered query (owner-scoped, §18.3).
 * @param {{ page?: number|string, limit?: number|string, sort?: object }} [options] - Page/limit/sort.
 * @param {(doc: object) => object} [mapDto] - ADR-017 per-domain DTO mapper (defaults to the serialized surface).
 * @returns {Promise<{ docs: object[], page: number, limit: number, totalDocs: number, totalPages: number }>}
 */
export async function paginate(model, query, options = {}, mapDto) {
  const rawPage = Number(options.page ?? PAGINATION_DEFAULT_PAGE);
  const rawLimit = Number(options.limit ?? PAGINATION_DEFAULT_LIMIT);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : PAGINATION_DEFAULT_PAGE;
  const limit = Math.min(
    Number.isInteger(rawLimit) && rawLimit >= 1 ? rawLimit : PAGINATION_DEFAULT_LIMIT,
    PAGINATION_MAX_LIMIT,
  );
  const sort = options.sort ?? {};

  const result = await model.paginate(query, { page, limit, sort });
  const docs = mapDto ? result.docs.map(mapDto) : result.docs;

  return {
    docs,
    page: result.page,
    limit: result.limit,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  };
}