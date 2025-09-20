const BaseDAO = require('./BaseDAO');

/**
 * DAO for film operations
 */
class FilmDAO extends BaseDAO {
  constructor() {
    super('film', 'film_id');
  }

  /**
   * Get films with category and store information
   */
  async getFilmsWithDetails(page = 1, limit = 12, search = '', categoryId = null, sortBy = 'title') {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ` AND (f.title LIKE ? OR f.description LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (categoryId) {
      whereClause += ` AND c.category_id = ?`;
      params.push(categoryId);
    }

    // Determine ORDER BY clause
    let orderByClause = 'ORDER BY f.title';
    if (sortBy === 'popular') {
      orderByClause = 'ORDER BY f.rental_rate DESC, f.title';
    } else if (sortBy === 'rating') {
      orderByClause = 'ORDER BY f.rating DESC, f.title';
    }

    const sql = `
      SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rental_duration,
        f.rental_rate,
        f.length,
        f.replacement_cost,
        f.rating,
        f.special_features,
        c.name as category_name,
        l.name as language_name,
        COUNT(DISTINCT i.inventory_id) as total_copies,
        COUNT(DISTINCT CASE WHEN i.inventory_id NOT IN (
          SELECT inventory_id FROM rental WHERE return_date IS NULL
        ) THEN i.inventory_id END) as available_copies
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN language l ON f.language_id = l.language_id
      LEFT JOIN inventory i ON f.film_id = i.film_id
      ${whereClause}
      GROUP BY f.film_id, f.title, f.description, f.release_year, f.rental_duration, 
               f.rental_rate, f.length, f.replacement_cost, f.rating, f.special_features,
               c.name, l.name
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    return await this.query(sql, [...params, limit, offset]);
  }

  /**
   * Get film details by ID with all related information
   */
  async getFilmDetails(filmId) {
    const sql = `
      SELECT 
        f.*,
        c.name as category_name,
        l.name as language_name,
        COUNT(DISTINCT i.inventory_id) as total_copies,
        COUNT(DISTINCT CASE WHEN i.inventory_id NOT IN (
          SELECT inventory_id FROM rental WHERE return_date IS NULL
        ) THEN i.inventory_id END) as available_copies
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN language l ON f.language_id = l.language_id
      LEFT JOIN inventory i ON f.film_id = i.film_id
      WHERE f.film_id = ?
      GROUP BY f.film_id, f.title, f.description, f.release_year, f.rental_duration, 
               f.rental_rate, f.length, f.replacement_cost, f.rating, f.special_features,
               c.name, l.name
    `;

    const results = await this.query(sql, [filmId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get total count of films for pagination
   */
  async getFilmsCount(search = '', categoryId = null) {
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ` AND (f.title LIKE ? OR f.description LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (categoryId) {
      whereClause += ` AND fc.category_id = ?`;
      params.push(categoryId);
    }

    const sql = `
      SELECT COUNT(DISTINCT f.film_id) as count
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      ${whereClause}
    `;

    const results = await this.query(sql, params);
    return results[0].count;
  }

  /**
   * Get all film categories
   */
  async getAllCategories() {
    const sql = `
      SELECT category_id, name
      FROM category
      ORDER BY name
    `;

    return await this.query(sql);
  }

  /**
   * Search films by title or description
   */
  async searchFilms(searchTerm, page = 1, limit = 12) {
    return await this.getFilmsWithDetails(page, limit, searchTerm);
  }

  /**
   * Get films by category
   */
  async getFilmsByCategory(categoryId, page = 1, limit = 12) {
    return await this.getFilmsWithDetails(page, limit, '', categoryId);
  }

  /**
   * Get rental information for a film
   */
  async getFilmRentalInfo(filmId) {
    const sql = `
      SELECT 
        i.inventory_id,
        i.store_id,
        CASE 
          WHEN r.rental_id IS NOT NULL AND r.return_date IS NULL THEN 'rented'
          ELSE 'available'
        END as status,
        r.rental_date,
        r.return_date,
        CONCAT(c.first_name, ' ', c.last_name) as rented_by
      FROM inventory i
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
      LEFT JOIN customer c ON r.customer_id = c.customer_id
      WHERE i.film_id = ?
      ORDER BY i.inventory_id
    `;

    return await this.query(sql, [filmId]);
  }

  /**
   * Check if film is available for rental
   */
  async isFilmAvailable(filmId) {
    const sql = `
      SELECT COUNT(*) as available_count
      FROM inventory i
      WHERE i.film_id = ? 
      AND i.inventory_id NOT IN (
        SELECT inventory_id FROM rental WHERE return_date IS NULL
      )
    `;

    const results = await this.query(sql, [filmId]);
    return results[0].available_count > 0;
  }

  /**
   * Get film inventory by store
   */
  async getFilmInventoryByStore(filmId) {
    const sql = `
      SELECT 
        s.store_id,
        CONCAT(s_staff.first_name, ' ', s_staff.last_name) as manager_name,
        COUNT(i.inventory_id) as total_copies,
        COUNT(CASE WHEN r.rental_id IS NULL OR r.return_date IS NOT NULL 
              THEN i.inventory_id END) as available_copies
      FROM store s
      LEFT JOIN staff s_staff ON s.manager_staff_id = s_staff.staff_id
      LEFT JOIN inventory i ON s.store_id = i.store_id AND i.film_id = ?
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
      GROUP BY s.store_id, s_staff.first_name, s_staff.last_name
      ORDER BY s.store_id
    `;

    return await this.query(sql, [filmId]);
  }

  /**
   * Add a new film (for admin/staff use)
   */
  async createFilm(filmData) {
    const { title, description, releaseYear, languageId, rentalDuration, rentalRate, length, replacementCost, rating, specialFeatures } = filmData;

    const sql = `
      INSERT INTO film (title, description, release_year, language_id, rental_duration, rental_rate, length, replacement_cost, rating, special_features, last_update)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    return await this.query(sql, [
      title,
      description,
      releaseYear,
      languageId,
      rentalDuration || 3,
      rentalRate,
      length,
      replacementCost,
      rating || 'G',
      specialFeatures
    ]);
  }

  /**
   * Update film information
   */
  async updateFilm(filmId, filmData) {
    const fields = [];
    const values = [];

    // Dynamically build update query based on provided fields
    for (const [key, value] of Object.entries(filmData)) {
      if (value !== undefined) {
        // Convert camelCase to snake_case for database columns
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbField} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('last_update = NOW()');
    values.push(filmId);

    const sql = `
      UPDATE film 
      SET ${fields.join(', ')}
      WHERE film_id = ?
    `;

    return await this.query(sql, values);
  }

  /**
   * Get most popular films (by rental count)
   */
  async getPopularFilms(limit = 12) {
    const sql = `
      SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rental_duration,
        f.rental_rate,
        f.length,
        f.replacement_cost,
        f.rating,
        f.special_features,
        c.name as category_name,
        l.name as language_name,
        COUNT(DISTINCT r.rental_id) as rental_count,
        COUNT(DISTINCT i.inventory_id) as total_copies,
        COUNT(DISTINCT CASE WHEN i.inventory_id NOT IN (
          SELECT inventory_id FROM rental WHERE return_date IS NULL
        ) THEN i.inventory_id END) as available_copies
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN language l ON f.language_id = l.language_id
      LEFT JOIN inventory i ON f.film_id = i.film_id
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id
      GROUP BY f.film_id, f.title, f.description, f.release_year, f.rental_duration, 
               f.rental_rate, f.length, f.replacement_cost, f.rating, f.special_features,
               c.name, l.name
      ORDER BY rental_count DESC, f.title
      LIMIT ?
    `;

    return await this.query(sql, [limit]);
  }

  /**
   * Get single film with all details including availability
   */
  async getFilmWithDetails(filmId) {
    const sql = `
      SELECT 
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.rental_duration,
        f.rental_rate,
        f.length,
        f.replacement_cost,
        f.rating,
        f.special_features,
        c.category_id,
        c.name as category_name,
        l.name as language_name,
        COUNT(i.inventory_id) as total_copies,
        COUNT(CASE WHEN i.inventory_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM rental r 
          WHERE r.inventory_id = i.inventory_id 
          AND r.return_date IS NULL
        ) THEN i.inventory_id END) as available_copies
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN language l ON f.language_id = l.language_id
      LEFT JOIN inventory i ON f.film_id = i.film_id
      WHERE f.film_id = ?
      GROUP BY f.film_id, c.category_id, c.name, l.name
    `;

    const [rows] = await this.db.execute(sql, [filmId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get store inventory for a specific film
   */
  async getFilmStoreInventory(filmId) {
    const sql = `
      SELECT 
        s.store_id,
        s.manager_staff_id,
        a.address,
        c.city,
        co.country,
        COUNT(i.inventory_id) as total_copies,
        COUNT(CASE WHEN i.inventory_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM rental r 
          WHERE r.inventory_id = i.inventory_id 
          AND r.return_date IS NULL
        ) THEN i.inventory_id END) as available_copies
      FROM store s
      LEFT JOIN address a ON s.address_id = a.address_id
      LEFT JOIN city c ON a.city_id = c.city_id
      LEFT JOIN country co ON c.country_id = co.country_id
      LEFT JOIN inventory i ON s.store_id = i.store_id AND i.film_id = ?
      GROUP BY s.store_id, s.manager_staff_id, a.address, c.city, co.country
      ORDER BY s.store_id
    `;

    const [rows] = await this.db.execute(sql, [filmId]);
    return rows;
  }

  /**
   * Check availability in specific store
   */
  async checkStoreAvailability(filmId, storeId) {
    const sql = `
      SELECT 
        COUNT(i.inventory_id) as total_copies,
        COUNT(CASE WHEN NOT EXISTS (
          SELECT 1 FROM rental r 
          WHERE r.inventory_id = i.inventory_id 
          AND r.return_date IS NULL
        ) THEN i.inventory_id END) as available_copies
      FROM inventory i
      WHERE i.film_id = ? AND i.store_id = ?
    `;

    const [rows] = await this.db.execute(sql, [filmId, storeId]);
    return rows[0] || { total_copies: 0, available_copies: 0 };
  }

  /**
   * Create a rental record
   */
  async createRental(filmId, customerId, storeId) {
    const connection = await this.db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Find available inventory item
      const [inventoryRows] = await connection.execute(`
        SELECT i.inventory_id 
        FROM inventory i
        WHERE i.film_id = ? AND i.store_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM rental r 
          WHERE r.inventory_id = i.inventory_id 
          AND r.return_date IS NULL
        )
        LIMIT 1
      `, [filmId, storeId]);

      if (inventoryRows.length === 0) {
        throw new Error('Geen beschikbare exemplaren gevonden');
      }

      const inventoryId = inventoryRows[0].inventory_id;

      // Get staff member for this store
      const [staffRows] = await connection.execute(`
        SELECT staff_id FROM staff WHERE store_id = ? AND active = 1 LIMIT 1
      `, [storeId]);

      if (staffRows.length === 0) {
        throw new Error('Geen actieve medewerker gevonden voor deze winkel');
      }

      const staffId = staffRows[0].staff_id;

      // Create rental record
      const [rentalResult] = await connection.execute(`
        INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id)
        VALUES (NOW(), ?, ?, ?)
      `, [inventoryId, customerId, staffId]);

      await connection.commit();
      
      return {
        rentalId: rentalResult.insertId,
        inventoryId: inventoryId,
        staffId: staffId
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get available inventory for a film
   */
  async getAvailableInventory(filmId, storeId) {
    const [rows] = await this.db.execute(`
      SELECT i.inventory_id
      FROM inventory i
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id 
        AND r.return_date IS NULL 
        AND r.status IN ('paid', 'rented')
      WHERE i.film_id = ? AND i.store_id = ?
        AND r.rental_id IS NULL
      LIMIT 1
    `, [filmId, storeId]);
    
    return rows;
  }

  /**
   * Search available films for staff interface
   */
  async searchAvailableFilms(query) {
    try {
      const sql = `
        SELECT 
          f.film_id,
          f.title,
          f.description,
          f.rental_rate,
          COUNT(i.inventory_id) as total_copies,
          COUNT(CASE WHEN r.rental_id IS NULL THEN 1 END) as available_copies
        FROM film f
        LEFT JOIN inventory i ON f.film_id = i.film_id
        LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
        WHERE f.title LIKE ?
        GROUP BY f.film_id, f.title, f.description, f.rental_rate
        HAVING available_copies > 0
        ORDER BY f.title
        LIMIT 20
      `;
      
      return await this.query(sql, [`%${query}%`]);
    } catch (error) {
      console.error('FilmDAO searchAvailableFilms error:', error);
      return [];
    }
  }
}

module.exports = FilmDAO;