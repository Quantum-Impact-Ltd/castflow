import { prisma } from '../lib/prisma'

// TODO: implement BookingService
// Rules from apps/api/CLAUDE.md:
//   - All business logic goes here, NOT in route handlers
//   - Multi-table operations must use prisma.$transaction()
//   - Throw AppError for all expected failures

export class BookingService {
  protected static readonly db = prisma
}
