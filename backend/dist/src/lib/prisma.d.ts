import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
declare const prisma: PrismaClient<{
    adapter: PrismaMssql;
}, never, import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
