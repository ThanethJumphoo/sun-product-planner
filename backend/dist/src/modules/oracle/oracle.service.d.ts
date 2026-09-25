import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as oracledb from 'oracledb';
export declare class OracleService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private pool;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    executeQuery<T = any>(sql: string, binds?: any, options?: oracledb.ExecuteOptions): Promise<T[]>;
    getStream(sql: string, binds?: any, options?: oracledb.ExecuteOptions): Promise<any>;
}
