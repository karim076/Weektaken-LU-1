const BaseDAO = require('./BaseDAO');

/**
 * DAO for film operations
 */
class FilmDAO extends BaseDAO {
  constructor() {
    super();
  }

  /**
   * Search films by title
   */
  searchFilms(searchTerm, page = 1, limit = 12, callback) {
    this.getFilmsWithDetails(page, limit, searchTerm, null, callback);
  }

  /**
   * Get films by category
   */
  getFilmsByCategory(categoryId, page = 1, limit = 12, callback) {
    this.getFilmsWithDetails(page, limit, '', categoryId, callback);
  }

  /**
   * Get films with category and store information
   */
  getFilmsWithDetails(page = 1, limit = 12, search = '', categoryId = null, sortBy = 'title', callback) {
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
        1 as total_copies,
        1 as available_copies
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN language l ON f.language_id = l.language_id
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    this.query(sql, [...params, limit, offset], callback);
  }

  /**
   * Get film details by ID with all related information
   */
  getFilmDetails(filmId, callback) {
    const sql = `
      SELECT 
        f.*,
        c.name as category_name,
        l.name as language_name,
        1 as total_copies,
        1 as available_copies
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN language l ON f.language_id = l.language_id
      WHERE f.film_id = ?
    `;

    this.query(sql, [filmId], (error, results) => {
      if (error) {
        return callback(error);
      }
      callback(null, results.length > 0 ? results[0] : null);
    });
  }

  /**
   * Get total count of films for pagination
   */
  getFilmsCount(search = '', categoryId = null, callback) {
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

    this.query(sql, params, (error, results) => {
      if (error) {
        return callback(error);
      }
      callback(null, results[0].count);
    });
  }

  /**
   * Get all film categories
   */
  getAllCategories(callback) {
    const sql = `
      SELECT category_id, name
      FROM category
      ORDER BY name
    `;

    this.query(sql, [], callback);
  }

  /**
   * Get rental information for a film
   */
  getFilmRentalInfo(filmId, callback) {
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

    this.query(sql, [filmId], callback);
  }

  /**
   * Check if film is available for rental
   */
  isFilmAvailable(filmId, callback) {
    const sql = `
      SELECT COUNT(*) as available_count
      FROM inventory i
      WHERE i.film_id = ? 
      AND i.inventory_id NOT IN (
        SELECT inventory_id FROM rental WHERE return_date IS NULL
      )
    `;

    this.query(sql, [filmId], (error, results) => {
      if (error) {
        return callback(error);
      }
      callback(null, results[0].available_count > 0);
    });
  }

  /**
   * Get film inventory by store
   */
  getFilmInventoryByStore(filmId, callback) {
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

    this.query(sql, [filmId], callback);
  }

  /**
   * Add a new film (for admin/staff use)
   */
  createFilm(filmData, callback) {
    const { title, description, releaseYear, languageId, rentalDuration, rentalRate, length, replacementCost, rating, specialFeatures } = filmData;

    const sql = `
      INSERT INTO film (title, description, release_year, language_id, rental_duration, rental_rate, length, replacement_cost, rating, special_features, last_update)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    this.query(sql, [
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
    ], callback);
  }

  /**
   * Update film information
   */
  updateFilm(filmId, filmData, callback) {
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
      return callback(new Error('No fields to update'));
    }

    fields.push('last_update = NOW()');
    values.push(filmId);

    const sql = `
      UPDATE film 
      SET ${fields.join(', ')}
      WHERE film_id = ?
    `;

    this.query(sql, values, callback);
  }

  /**
   * Get most popular films (by rental count)
   */
  getPopularFilms(limit = 12, callback) {
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
        0 as rental_count,
        1 as total_copies,
        1 as available_copies
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN language l ON f.language_id = l.language_id
      ORDER BY f.title
      LIMIT ?
    `;

    this.query(sql, [limit], callback);
  }

  /**
   * Get single film with all details including availability
   */
  getFilmWithDetails(filmId, callback) {
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

    this.query(sql, [filmId], (error, rows) => {
      if (error) {
        return callback(error);
      }
      callback(null, rows.length > 0 ? rows[0] : null);
    });
  }

  /**
   * Get store inventory for a specific film
   */
  getFilmStoreInventory(filmId, callback) {
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

    this.query(sql, [filmId], callback);
  }

  /**
   * Check availability in specific store
   */
  checkStoreAvailability(filmId, storeId, callback) {
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

    this.query(sql, [filmId, storeId], (error, rows) => {
      if (error) {
        return callback(error);
      }
      callback(null, rows[0] || { total_copies: 0, available_copies: 0 });
    });
  }

  /**
   * Create a rental record (simplified version for callback interface)
   */
  createRental(filmId, customerId, storeId, callback) {
    // For now, return an error as this functionality should be handled by RentalDAO
    callback(new Error('Rental creation should be handled by RentalDAO'));
  }

  /**
   * Get available inventory for a film
   */
  getAvailableInventory(filmId, storeId, callback) {
    this.query(`
      SELECT i.inventory_id
      FROM inventory i
      LEFT JOIN rental r ON i.inventory_id = r.inventory_id 
        AND r.return_date IS NULL 
        AND r.status IN ('paid', 'rented')
      WHERE i.film_id = ? AND i.store_id = ?
        AND r.rental_id IS NULL
      LIMIT 1
    `, [filmId, storeId], callback);
  }

  /**
   * Search available films for staff interface
   */
  searchAvailableFilms(query, callback) {
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
    
    this.query(sql, [`%${query}%`], (error, result) => {
      if (error) {
        console.error('FilmDAO searchAvailableFilms error:', error);
        return callback(error);
      }
      callback(null, result);
    });
  }
}

module.exports = FilmDAO;