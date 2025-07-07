/**
 * ============================================================================
 * DATABASE SERVICE UTILITY
 * ============================================================================
 * Provides database abstraction layer for Cloudflare D1
 * Includes query building, transactions, and common operations
 */

/**
 * Database service class for D1 operations
 */
export class DatabaseService {
    constructor(d1Database) {
      this.db = d1Database;
    }
  
    /**
     * Execute a raw SQL query
     */
    async execute(query) {
      try {
        if (typeof query === 'string') {
          return await this.db.prepare(query).all();
        } else {
          return await this.db.prepare(query.sql).bind(...(query.args || [])).all();
        }
      } catch (error) {
        console.error('Database execute error:', error);
        throw new DatabaseError('Query execution failed', error);
      }
    }
  
    /**
     * Execute a query and return first result
     */
    async first(query) {
      try {
        if (typeof query === 'string') {
          return await this.db.prepare(query).first();
        } else {
          return await this.db.prepare(query.sql).bind(...(query.args || [])).first();
        }
      } catch (error) {
        console.error('Database first error:', error);
        throw new DatabaseError('Query execution failed', error);
      }
    }
  
    /**
     * Execute multiple queries in a batch
     */
    async batch(queries) {
      try {
        const statements = queries.map(query => {
          if (typeof query === 'string') {
            return this.db.prepare(query);
          } else {
            return this.db.prepare(query.sql).bind(...(query.args || []));
          }
        });
        
        return await this.db.batch(statements);
      } catch (error) {
        console.error('Database batch error:', error);
        throw new DatabaseError('Batch execution failed', error);
      }
    }
  
    /**
     * Begin a transaction
     */
    async transaction(callback) {
      try {
        return await this.db.transaction(callback);
      } catch (error) {
        console.error('Database transaction error:', error);
        throw new DatabaseError('Transaction failed', error);
      }
    }
  
    /**
     * Generic CRUD operations
     */
  
    /**
     * Insert a new record
     */
    async insert(table, data, options = {}) {
      try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');
        
        const sql = `
          INSERT INTO ${table} (${columns.join(', ')})
          VALUES (${placeholders})
          ${options.returning ? `RETURNING ${options.returning}` : ''}
        `;
        
        const result = await this.execute({ sql, args: values });
        
        if (options.returning) {
          return result.results[0];
        }
        
        return {
          success: true,
          insertId: result.meta?.last_row_id,
          changes: result.meta?.changes || 0
        };
        
      } catch (error) {
        console.error('Database insert error:', error);
        throw new DatabaseError(`Insert into ${table} failed`, error);
      }
    }
  
    /**
     * Update records
     */
    async update(table, data, where, whereArgs = []) {
      try {
        const setClause = Object.keys(data)
          .map(key => `${key} = ?`)
          .join(', ');
        
        const values = [...Object.values(data), ...whereArgs];
        
        const sql = `
          UPDATE ${table} 
          SET ${setClause}, updated_at = datetime('now')
          WHERE ${where}
        `;
        
        const result = await this.execute({ sql, args: values });
        
        return {
          success: true,
          changes: result.meta?.changes || 0
        };
        
      } catch (error) {
        console.error('Database update error:', error);
        throw new DatabaseError(`Update ${table} failed`, error);
      }
    }
  
    /**
     * Delete records (soft delete by default)
     */
    async delete(table, where, whereArgs = [], options = {}) {
      try {
        let sql;
        const args = whereArgs;
        
        if (options.hard === true) {
          // Hard delete
          sql = `DELETE FROM ${table} WHERE ${where}`;
        } else {
          // Soft delete
          sql = `
            UPDATE ${table} 
            SET deleted_at = datetime('now'), updated_at = datetime('now')
            WHERE ${where} AND deleted_at IS NULL
          `;
        }
        
        const result = await this.execute({ sql, args });
        
        return {
          success: true,
          changes: result.meta?.changes || 0
        };
        
      } catch (error) {
        console.error('Database delete error:', error);
        throw new DatabaseError(`Delete from ${table} failed`, error);
      }
    }
  
    /**
     * Find records with conditions
     */
    async find(table, options = {}) {
      try {
        const {
          select = '*',
          where = '1=1',
          whereArgs = [],
          orderBy = '',
          limit = null,
          offset = null,
          includeDeleted = false
        } = options;
        
        let sql = `SELECT ${select} FROM ${table}`;
        
        // Add where clause
        let whereClause = where;
        if (!includeDeleted) {
          whereClause += ' AND deleted_at IS NULL';
        }
        sql += ` WHERE ${whereClause}`;
        
        // Add order by
        if (orderBy) {
          sql += ` ORDER BY ${orderBy}`;
        }
        
        // Add limit and offset
        if (limit) {
          sql += ` LIMIT ${limit}`;
          if (offset) {
            sql += ` OFFSET ${offset}`;
          }
        }
        
        const result = await this.execute({ sql, args: whereArgs });
        return result.results || [];
        
      } catch (error) {
        console.error('Database find error:', error);
        throw new DatabaseError(`Find in ${table} failed`, error);
      }
    }
  
    /**
     * Find single record by ID
     */
    async findById(table, id, options = {}) {
      try {
        const records = await this.find(table, {
          ...options,
          where: 'id = ?',
          whereArgs: [id],
          limit: 1
        });
        
        return records[0] || null;
        
      } catch (error) {
        console.error('Database findById error:', error);
        throw new DatabaseError(`Find by ID in ${table} failed`, error);
      }
    }
  
    /**
     * Count records
     */
    async count(table, where = '1=1', whereArgs = [], includeDeleted = false) {
      try {
        let whereClause = where;
        if (!includeDeleted) {
          whereClause += ' AND deleted_at IS NULL';
        }
        
        const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`;
        const result = await this.first({ sql, args: whereArgs });
        
        return result?.count || 0;
        
      } catch (error) {
        console.error('Database count error:', error);
        throw new DatabaseError(`Count in ${table} failed`, error);
      }
    }
  
    /**
     * Check if record exists
     */
    async exists(table, where, whereArgs = [], includeDeleted = false) {
      try {
        const count = await this.count(table, where, whereArgs, includeDeleted);
        return count > 0;
        
      } catch (error) {
        console.error('Database exists error:', error);
        throw new DatabaseError(`Exists check in ${table} failed`, error);
      }
    }
  
    /**
     * Paginated query
     */
    async paginate(table, options = {}) {
      try {
        const {
          page = 1,
          pageSize = 20,
          select = '*',
          where = '1=1',
          whereArgs = [],
          orderBy = 'id DESC',
          includeDeleted = false
        } = options;
        
        const offset = (page - 1) * pageSize;
        
        // Get total count
        const totalCount = await this.count(table, where, whereArgs, includeDeleted);
        
        // Get records
        const records = await this.find(table, {
          select,
          where,
          whereArgs,
          orderBy,
          limit: pageSize,
          offset,
          includeDeleted
        });
        
        const totalPages = Math.ceil(totalCount / pageSize);
        
        return {
          data: records,
          pagination: {
            page,
            pageSize,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        };
        
      } catch (error) {
        console.error('Database paginate error:', error);
        throw new DatabaseError(`Paginate ${table} failed`, error);
      }
    }
  
    /**
     * Search with full-text search
     */
    async search(table, query, options = {}) {
      try {
        const {
          columns = ['name'],
          limit = 50,
          orderBy = 'relevance DESC'
        } = options;
        
        // Use FTS5 if available, otherwise fall back to LIKE
        const ftsTable = `${table}_fts`;
        
        // Try FTS first
        try {
          const ftsQuery = `
            SELECT ${table}.*, ${ftsTable}.rank
            FROM ${ftsTable}
            JOIN ${table} ON ${table}.id = ${ftsTable}.rowid
            WHERE ${ftsTable} MATCH ?
            AND ${table}.deleted_at IS NULL
            ORDER BY ${ftsTable}.rank
            LIMIT ?
          `;
          
          const result = await this.execute({
            sql: ftsQuery,
            args: [query, limit]
          });
          
          return result.results || [];
          
        } catch (ftsError) {
          // Fall back to LIKE search
          const likeConditions = columns.map(col => `${col} LIKE ?`).join(' OR ');
          const likeArgs = columns.map(() => `%${query}%`);
          
          const records = await this.find(table, {
            where: `(${likeConditions})`,
            whereArgs: likeArgs,
            orderBy,
            limit
          });
          
          return records;
        }
        
      } catch (error) {
        console.error('Database search error:', error);
        throw new DatabaseError(`Search in ${table} failed`, error);
      }
    }
  
    /**
     * Get database statistics
     */
    async getStats() {
      try {
        const tables = [
          'users', 'products', 'orders', 'order_items', 
          'customers', 'categories', 'inventory'
        ];
        
        const stats = {};
        
        for (const table of tables) {
          try {
            const count = await this.count(table);
            stats[table] = count;
          } catch (error) {
            console.warn(`Failed to get count for table ${table}:`, error);
            stats[table] = 0;
          }
        }
        
        return stats;
        
      } catch (error) {
        console.error('Database stats error:', error);
        throw new DatabaseError('Failed to get database statistics', error);
      }
    }
  
    /**
     * Execute raw query with error handling
     */
    async raw(sql, args = []) {
      try {
        return await this.execute({ sql, args });
      } catch (error) {
        console.error('Database raw query error:', error);
        throw new DatabaseError('Raw query failed', error);
      }
    }
  
    /**
     * Backup table data
     */
    async backupTable(table) {
      try {
        const data = await this.find(table, { includeDeleted: true });
        return {
          table,
          timestamp: new Date().toISOString(),
          recordCount: data.length,
          data
        };
      } catch (error) {
        console.error('Database backup error:', error);
        throw new DatabaseError(`Backup ${table} failed`, error);
      }
    }
  }
  
  /**
   * Custom Database Error class
   */
  export class DatabaseError extends Error {
    constructor(message, originalError = null) {
      super(message);
      this.name = 'DatabaseError';
      this.originalError = originalError;
      
      if (originalError) {
        this.stack = originalError.stack;
      }
    }
  }
  
  /**
   * Query builder utility
   */
  export class QueryBuilder {
    constructor(table) {
      this.table = table;
      this.selectClause = '*';
      this.whereConditions = [];
      this.whereArgs = [];
      this.orderByClause = '';
      this.limitClause = '';
      this.offsetClause = '';
      this.joinClauses = [];
    }
  
    select(columns) {
      this.selectClause = Array.isArray(columns) ? columns.join(', ') : columns;
      return this;
    }
  
    where(condition, ...args) {
      this.whereConditions.push(condition);
      this.whereArgs.push(...args);
      return this;
    }
  
    whereIn(column, values) {
      const placeholders = values.map(() => '?').join(', ');
      this.whereConditions.push(`${column} IN (${placeholders})`);
      this.whereArgs.push(...values);
      return this;
    }
  
    whereLike(column, value) {
      this.whereConditions.push(`${column} LIKE ?`);
      this.whereArgs.push(`%${value}%`);
      return this;
    }
  
    orderBy(column, direction = 'ASC') {
      this.orderByClause = `${column} ${direction}`;
      return this;
    }
  
    limit(count) {
      this.limitClause = `LIMIT ${count}`;
      return this;
    }
  
    offset(count) {
      this.offsetClause = `OFFSET ${count}`;
      return this;
    }
  
    join(table, condition) {
      this.joinClauses.push(`JOIN ${table} ON ${condition}`);
      return this;
    }
  
    leftJoin(table, condition) {
      this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
      return this;
    }
  
    build() {
      let sql = `SELECT ${this.selectClause} FROM ${this.table}`;
      
      if (this.joinClauses.length > 0) {
        sql += ' ' + this.joinClauses.join(' ');
      }
      
      if (this.whereConditions.length > 0) {
        sql += ' WHERE ' + this.whereConditions.join(' AND ');
      }
      
      if (this.orderByClause) {
        sql += ` ORDER BY ${this.orderByClause}`;
      }
      
      if (this.limitClause) {
        sql += ` ${this.limitClause}`;
      }
      
      if (this.offsetClause) {
        sql += ` ${this.offsetClause}`;
      }
      
      return {
        sql,
        args: this.whereArgs
      };
    }
  }
  
  /**
   * Create a new query builder
   */
  export function query(table) {
    return new QueryBuilder(table);
  }