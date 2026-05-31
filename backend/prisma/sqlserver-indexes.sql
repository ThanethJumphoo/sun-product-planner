-- SQL Server Custom Scripts for Performance Tuning
-- This script should be executed after `npx prisma migrate deploy`

-- 1. Create a Covering Index for YieldRecord to speed up Dashboard reporting queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_YieldRecord_Order_Covering' AND object_id = OBJECT_ID('dbo.YieldRecord'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_YieldRecord_Order_Covering] 
    ON [dbo].[YieldRecord] ([orderId])
    INCLUDE ([inputWeight], [outputWeight], [yieldPercent]);
END
GO

-- 2. Create a Covering Index for ProductionOrder dashboard filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProductionOrder_Status_Covering' AND object_id = OBJECT_ID('dbo.ProductionOrder'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ProductionOrder_Status_Covering] 
    ON [dbo].[ProductionOrder] ([status])
    INCLUDE ([mpsId], [batchNo], [requiredWeight]);
END
GO
