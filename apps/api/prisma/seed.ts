import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.info('🌱 Seeding database...')

  // TODO: add seed data as features are built
  // Example: create a test admin user
  // Example: create sample jobs for development

  console.info('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
