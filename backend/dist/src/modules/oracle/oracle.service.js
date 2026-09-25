"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var OracleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleService = void 0;
const common_1 = require("@nestjs/common");
const oracledb = __importStar(require("oracledb"));
let OracleService = OracleService_1 = class OracleService {
    logger = new common_1.Logger(OracleService_1.name);
    pool;
    async onModuleInit() {
        try {
            oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
            oracledb.fetchArraySize = 10000;
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
        }
        catch (error) {
            this.logger.error('Failed to create Oracle DB Connection Pool. Check environment variables.', error);
        }
    }
    async onModuleDestroy() {
        if (this.pool) {
            try {
                await this.pool.close(10);
                this.logger.log('Oracle DB Connection Pool closed.');
            }
            catch (error) {
                this.logger.error('Error closing Oracle DB Connection Pool', error);
            }
        }
    }
    async executeQuery(sql, binds = {}, options = {}) {
        let connection;
        try {
            connection = await this.pool.getConnection();
            const execOptions = {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                fetchArraySize: 10000,
                ...options,
            };
            const result = await connection.execute(sql, binds, execOptions);
            return result.rows || [];
        }
        catch (error) {
            this.logger.error(`Error executing query: ${sql}`, error);
            throw error;
        }
        finally {
            if (connection) {
                try {
                    await connection.close();
                }
                catch (err) {
                    this.logger.error('Error closing connection', err);
                }
            }
        }
    }
    async getStream(sql, binds = {}, options = {}) {
        const connection = await this.pool.getConnection();
        const execOptions = {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            resultSet: true,
            prefetchRows: 10000,
            fetchArraySize: 10000,
            ...options,
        };
        const result = await connection.execute(sql, binds, execOptions);
        const stream = result.resultSet.toQueryStream();
        stream.on('close', async () => {
            try {
                await connection.close();
            }
            catch (err) {
                this.logger.error('Error closing connection from stream', err);
            }
        });
        stream.on('error', async (err) => {
            this.logger.error('Stream error', err);
            try {
                await connection.close();
            }
            catch (closeErr) {
                this.logger.error('Error closing connection from stream error handler', closeErr);
            }
        });
        return stream;
    }
};
exports.OracleService = OracleService;
exports.OracleService = OracleService = OracleService_1 = __decorate([
    (0, common_1.Injectable)()
], OracleService);
//# sourceMappingURL=oracle.service.js.map