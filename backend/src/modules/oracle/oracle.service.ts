import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as oracledb from 'oracledb';

@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OracleService.name);
  private pool: oracledb.Pool;

  async onModuleInit() {
    try {
      // Configuration for Oracle Connection for fast loading
      // Setting outFormat to Object globally for easier parsing
      oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
      
      // Increase default fetch array size (default is 100). Higher size means fewer network round trips.
      // This is crucial for fast data loading from ERP.
      oracledb.fetchArraySize = 10000; 

      // Use environment variables for connection
      const dbHost = process.env.ORACLE_DB_HOST;
      const dbPort = process.env.ORACLE_DB_PORT;
      const dbService = process.env.ORACLE_DB_SERVICE;
      const dbUser = process.env.ORACLE_DB_USER;
      const dbPass = process.env.ORACLE_DB_PASS;

      if (!dbHost || !dbPort || !dbService || !dbUser || !dbPass) {
        throw new Error('Oracle DB credentials are not fully configured in environment variables.');
      }

      const connectString = `${dbHost}:${dbPort}/${dbService}`;

      this.pool = await oracledb.createPool({
        user: dbUser,
        password: dbPass,
        connectString,
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 2,
      });
      
      this.logger.log('Oracle DB Connection Pool created successfully.');
    } catch (error) {
      this.logger.error('Failed to create Oracle DB Connection Pool. Check environment variables.', error);
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      try {
        await this.pool.close(10);
        this.logger.log('Oracle DB Connection Pool closed.');
      } catch (error) {
        this.logger.error('Error closing Oracle DB Connection Pool', error);
      }
    }
  }

  /**
   * Fast Data Loading: Fetch all rows for a query.
   * Best for queries that return moderately large datasets that fit in memory.
   */
  async executeQuery<T = any>(sql: string, binds: any = {}, options: oracledb.ExecuteOptions = {}): Promise<T[]> {
    let connection: oracledb.Connection;
    try {
      connection = await this.pool.getConnection();
      
      const execOptions: oracledb.ExecuteOptions = {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        // Override global fetchArraySize if needed
        fetchArraySize: 10000, 
        ...options,
      };

      const result = await connection.execute<T>(sql, binds, execOptions);
      return result.rows || [];
    } catch (error) {
      this.logger.error(`Error executing query: ${sql}`, error);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          this.logger.error('Error closing connection', err);
        }
      }
    }
  }

  /**
   * Fast Data Loading: Stream massive datasets.
   * Best for huge tables (e.g. millions of rows) 
   * to avoid Out of Memory errors.
   */
  async getStream(sql: string, binds: any = {}, options: oracledb.ExecuteOptions = {}) {
    const connection = await this.pool.getConnection();
    
    const execOptions: oracledb.ExecuteOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      resultSet: true, // Enable Result Set for streaming
      prefetchRows: 10000, // Pre-fetch rows for stream efficiency
      fetchArraySize: 10000, 
      ...options,
    };

    const result = await connection.execute(sql, binds, execOptions);
    const stream = result.resultSet.toQueryStream();

    // Ensure connection is closed when stream is fully read or errors out
    stream.on('close', async () => {
      try {
        await connection.close();
      } catch (err) {
        this.logger.error('Error closing connection from stream', err);
      }
    });

    stream.on('error', async (err) => {
      this.logger.error('Stream error', err);
      try {
        await connection.close();
      } catch (closeErr) {
        this.logger.error('Error closing connection from stream error handler', closeErr);
      }
    });

    return stream;
  }
}
