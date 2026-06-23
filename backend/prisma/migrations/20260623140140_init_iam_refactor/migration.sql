BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[organizations] (
    [org_id] INT NOT NULL IDENTITY(1,1),
    [org_name] NVARCHAR(100) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [organizations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_by] INT,
    [updated_at] DATETIME2 NOT NULL,
    [updated_by] INT,
    [deleted_at] DATETIME2,
    [deleted_by] INT,
    CONSTRAINT [organizations_pkey] PRIMARY KEY CLUSTERED ([org_id]),
    CONSTRAINT [organizations_org_name_key] UNIQUE NONCLUSTERED ([org_name])
);

-- CreateTable
CREATE TABLE [dbo].[plants] (
    [plant_id] INT NOT NULL IDENTITY(1,1),
    [org_id] INT NOT NULL,
    [plant_code] NVARCHAR(50) NOT NULL,
    [plant_name] NVARCHAR(100) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [plants_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_by] INT,
    [updated_at] DATETIME2 NOT NULL,
    [updated_by] INT,
    [deleted_at] DATETIME2,
    [deleted_by] INT,
    CONSTRAINT [plants_pkey] PRIMARY KEY CLUSTERED ([plant_id]),
    CONSTRAINT [plants_plant_code_key] UNIQUE NONCLUSTERED ([plant_code])
);

-- CreateTable
CREATE TABLE [dbo].[users] (
    [user_id] INT NOT NULL IDENTITY(1,1),
    [user_code] NVARCHAR(50) NOT NULL,
    [username] NVARCHAR(100) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [users_status_df] DEFAULT 'ACTIVE',
    [auth_provider] NVARCHAR(50) NOT NULL CONSTRAINT [users_auth_provider_df] DEFAULT 'LOCAL',
    [mfa_enabled] BIT NOT NULL CONSTRAINT [users_mfa_enabled_df] DEFAULT 0,
    [password_changed_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_by] INT,
    [updated_at] DATETIME2 NOT NULL,
    [updated_by] INT,
    [deleted_at] DATETIME2,
    [deleted_by] INT,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([user_id]),
    CONSTRAINT [users_user_code_key] UNIQUE NONCLUSTERED ([user_code]),
    CONSTRAINT [users_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[roles] (
    [role_id] INT NOT NULL IDENTITY(1,1),
    [role_name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(255),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [roles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_by] INT,
    [updated_at] DATETIME2 NOT NULL,
    [updated_by] INT,
    [deleted_at] DATETIME2,
    [deleted_by] INT,
    CONSTRAINT [roles_pkey] PRIMARY KEY CLUSTERED ([role_id]),
    CONSTRAINT [roles_role_name_key] UNIQUE NONCLUSTERED ([role_name])
);

-- CreateTable
CREATE TABLE [dbo].[permissions] (
    [perm_id] INT NOT NULL IDENTITY(1,1),
    [permission_code] NVARCHAR(100) NOT NULL,
    [permission_name] NVARCHAR(100) NOT NULL,
    [module_name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(255),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [permissions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [created_by] INT,
    [updated_at] DATETIME2 NOT NULL,
    [updated_by] INT,
    [deleted_at] DATETIME2,
    [deleted_by] INT,
    CONSTRAINT [permissions_pkey] PRIMARY KEY CLUSTERED ([perm_id]),
    CONSTRAINT [permissions_permission_code_key] UNIQUE NONCLUSTERED ([permission_code])
);

-- CreateTable
CREATE TABLE [dbo].[user_roles] (
    [user_role_id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [role_id] INT NOT NULL,
    CONSTRAINT [user_roles_pkey] PRIMARY KEY CLUSTERED ([user_role_id]),
    CONSTRAINT [user_roles_user_id_role_id_key] UNIQUE NONCLUSTERED ([user_id],[role_id])
);

-- CreateTable
CREATE TABLE [dbo].[user_role_scopes] (
    [user_role_scope_id] INT NOT NULL IDENTITY(1,1),
    [user_role_id] INT NOT NULL,
    [scope_type] NVARCHAR(50) NOT NULL,
    [scope_value] NVARCHAR(100) NOT NULL,
    CONSTRAINT [user_role_scopes_pkey] PRIMARY KEY CLUSTERED ([user_role_scope_id])
);

-- CreateTable
CREATE TABLE [dbo].[role_permissions] (
    [role_id] INT NOT NULL,
    [perm_id] INT NOT NULL,
    CONSTRAINT [role_permissions_pkey] PRIMARY KEY CLUSTERED ([role_id],[perm_id])
);

-- CreateTable
CREATE TABLE [dbo].[user_sessions] (
    [session_id] NVARCHAR(100) NOT NULL,
    [user_id] INT NOT NULL,
    [device_id] NVARCHAR(255),
    [ip_address] NVARCHAR(50),
    [login_time] DATETIME2 NOT NULL CONSTRAINT [user_sessions_login_time_df] DEFAULT CURRENT_TIMESTAMP,
    [last_active] DATETIME2 NOT NULL CONSTRAINT [user_sessions_last_active_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [user_sessions_pkey] PRIMARY KEY CLUSTERED ([session_id])
);

-- CreateTable
CREATE TABLE [dbo].[user_preferences] (
    [pref_id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [preference_key] NVARCHAR(100) NOT NULL,
    [preference_value] NVARCHAR(max) NOT NULL,
    CONSTRAINT [user_preferences_pkey] PRIMARY KEY CLUSTERED ([pref_id]),
    CONSTRAINT [user_preferences_user_id_preference_key_key] UNIQUE NONCLUSTERED ([user_id],[preference_key])
);

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(50) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [category] NVARCHAR(100) NOT NULL,
    [uom] NVARCHAR(20) NOT NULL,
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Product_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[Demand] (
    [id] INT NOT NULL IDENTITY(1,1),
    [productId] INT NOT NULL,
    [quantity] DECIMAL(10,2) NOT NULL,
    [targetDate] DATE NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [Demand_status_df] DEFAULT 'DRAFT',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Demand_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Demand_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Mps] (
    [id] INT NOT NULL IDENTITY(1,1),
    [demandId] INT NOT NULL,
    [planDate] DATE NOT NULL,
    [plannedQty] DECIMAL(10,2) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [Mps_status_df] DEFAULT 'DRAFT',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Mps_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Mps_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProductionOrder] (
    [id] INT NOT NULL IDENTITY(1,1),
    [mpsId] INT NOT NULL,
    [batchNo] NVARCHAR(100) NOT NULL,
    [requiredWeight] DECIMAL(10,2) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [ProductionOrder_status_df] DEFAULT 'PENDING',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProductionOrder_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ProductionOrder_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProductionOrder_batchNo_key] UNIQUE NONCLUSTERED ([batchNo])
);

-- CreateTable
CREATE TABLE [dbo].[YieldRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orderId] INT NOT NULL,
    [inputWeight] DECIMAL(10,2) NOT NULL,
    [outputWeight] DECIMAL(10,2) NOT NULL,
    [yieldPercent] DECIMAL(5,2) NOT NULL,
    [recordedAt] DATETIME2 NOT NULL CONSTRAINT [YieldRecord_recordedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [YieldRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Inventory] (
    [id] INT NOT NULL IDENTITY(1,1),
    [productId] INT NOT NULL,
    [batchNo] NVARCHAR(100) NOT NULL,
    [weight] DECIMAL(10,2) NOT NULL,
    [location] NVARCHAR(100) NOT NULL,
    [lastUpdated] DATETIME2 NOT NULL,
    CONSTRAINT [Inventory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Inventory_productId_batchNo_location_key] UNIQUE NONCLUSTERED ([productId],[batchNo],[location])
);

-- CreateTable
CREATE TABLE [dbo].[StockMovement] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orderId] INT,
    [productId] INT NOT NULL,
    [batchNo] NVARCHAR(100) NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [weight] DECIMAL(10,2) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [StockMovement_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [StockMovement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Demand_targetDate_status_idx] ON [dbo].[Demand]([targetDate], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Mps_planDate_status_idx] ON [dbo].[Mps]([planDate], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProductionOrder_status_idx] ON [dbo].[ProductionOrder]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [YieldRecord_orderId_recordedAt_idx] ON [dbo].[YieldRecord]([orderId], [recordedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Inventory_batchNo_idx] ON [dbo].[Inventory]([batchNo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [StockMovement_productId_batchNo_idx] ON [dbo].[StockMovement]([productId], [batchNo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [StockMovement_createdAt_idx] ON [dbo].[StockMovement]([createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[plants] ADD CONSTRAINT [plants_org_id_fkey] FOREIGN KEY ([org_id]) REFERENCES [dbo].[organizations]([org_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([user_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([role_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_role_scopes] ADD CONSTRAINT [user_role_scopes_user_role_id_fkey] FOREIGN KEY ([user_role_id]) REFERENCES [dbo].[user_roles]([user_role_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[role_permissions] ADD CONSTRAINT [role_permissions_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([role_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[role_permissions] ADD CONSTRAINT [role_permissions_perm_id_fkey] FOREIGN KEY ([perm_id]) REFERENCES [dbo].[permissions]([perm_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_sessions] ADD CONSTRAINT [user_sessions_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([user_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_preferences] ADD CONSTRAINT [user_preferences_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([user_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Demand] ADD CONSTRAINT [Demand_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Mps] ADD CONSTRAINT [Mps_demandId_fkey] FOREIGN KEY ([demandId]) REFERENCES [dbo].[Demand]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProductionOrder] ADD CONSTRAINT [ProductionOrder_mpsId_fkey] FOREIGN KEY ([mpsId]) REFERENCES [dbo].[Mps]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[YieldRecord] ADD CONSTRAINT [YieldRecord_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[ProductionOrder]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Inventory] ADD CONSTRAINT [Inventory_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StockMovement] ADD CONSTRAINT [StockMovement_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[ProductionOrder]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
