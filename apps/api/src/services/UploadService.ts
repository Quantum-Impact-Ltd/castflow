import { prisma } from '../lib/prisma'

// TODO: implement UploadService
// Rules from apps/api/CLAUDE.md:
//   - All business logic goes here, NOT in route handlers
//   - Multi-table operations must use prisma.$transaction()
//   - Throw AppError for all expected failures

export class UploadService {
  protected static readonly db = prisma
}
