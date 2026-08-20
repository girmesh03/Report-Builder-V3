/**
 * @module routes/branch
 *
 * The §30 route module, mounted by the §26.5 registry at `/api/v1`.
 * Every endpoint requires the access cookie (§28.4); all sit on the
 * global tier (§27.3 — the global limiter already covers these
 * paths). Chains mount before the controller with `validate()`
 * between them (§29.3).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listBranches,
  getBranch,
  getBranchDetail,
  createBranch,
  updateBranch,
  archiveBranch,
  restoreBranch,
  deleteBranch,
} from '../controllers/branch.controller.js';
import { createChain, updateChain, branchIdParam, listQuery } from '../validators/branch.validator.js';
import { validate } from '../validators/validation.js';

const branchRoutes = Router();

branchRoutes.use(authenticate);

branchRoutes.get('/', listQuery, validate, listBranches);
branchRoutes.get('/:branchId', branchIdParam, validate, getBranch);
branchRoutes.get('/:branchId/detail', branchIdParam, validate, getBranchDetail);
branchRoutes.post('/', createChain, validate, createBranch);
branchRoutes.patch('/:branchId', branchIdParam, updateChain, validate, updateBranch);
branchRoutes.post('/:branchId/archive', branchIdParam, validate, archiveBranch);
branchRoutes.post('/:branchId/restore', branchIdParam, validate, restoreBranch);
branchRoutes.delete('/:branchId', branchIdParam, validate, deleteBranch);

export default branchRoutes;