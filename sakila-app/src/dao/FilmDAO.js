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
  async getFilmsWithDetails(page = 1, limit = 12, search = '', categoryId = null) {
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
      GROUP BY f.film_id
      ORDER BY f.title
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
        ol.name as original_language_name,
        COUNT(DISTINCT i.inventory_id) as total_copies,
        COUNT(DISTINCT CASE WHEN i.inventory_id NOT IN (
          SELECT inventory_id FROM rental WHERE return_date IS NULL
        ) THEN i.inventory_id END) as available_copies
      FROM film f
      LEFT JOIN film_category fc ON f.film_id = fc.film_id
      LEFT JOIN category c ON fc.category_id = c.category_id
      LEFT JOIN language l ON f.language_id = l.language_id
      LEFT JOIN language ol ON f.original_language_id = ol.language_id
      LEFT JOIN inventory i ON f.film_id = i.film_id
      WHERE f.film_id = ?
      GROUP BY f.film_id
    `;

    const results = await this.query(sql, [filmId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get film actors
   */
  async getFilmActors(filmId) {
    const sql = `
      SELECT 
        a.actor_id,
        a.first_name,
        a.last_name,
        CONCAT(a.first_name, ' ', a.last_name) as full_name
      FROM actor a
      JOIN film_actor fa ON a.actor_id = fa.actor_id
      WHERE fa.film_id = ?
      ORDER BY a.first_name, a.last_name
    `;

    return await this.query(sql, [filmId]);
  }

  /**
   * Get film text (search text)
   */
  async getFilmText(filmId) {
    const sql = `
      SELECT 
        film_id,
        title,
        description
      FROM film_text
      WHERE film_id = ?
    `;

    const results = await this.query(sql, [filmId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get store inventory for a film
   */
  async getFilmStoreInventory(filmId) {
    const sql = `
      SELECT 
        s.store_id,
        COUNT(i.inventory_id) as total_copies,
        COUNT(CASE WHEN i.inventory_id NOT IN (
          SELECT inventory_id FROM rental WHERE return_date IS NULL
        ) THEN i.inventory_id END) as available_copies
      FROM store s
      LEFT JOIN inventory i ON s.store_id = i.store_id AND i.film_id = ?
      GROUP BY s.store_id
      ORDER BY s.store_id
    `;

    return await this.query(sql, [filmId]);
  }

  /**
   * Get all categories
   */
  async getAllCategories() {
    const sql = `
      SELECT 
        category_id,
        name,
        COUNT(fc.film_id) as film_count
      FROM category c
      LEFT JOIN film_category fc ON c.category_id = fc.category_id
      GROUP BY c.category_id
      ORDER BY c.name
    `;

    return await this.query(sql);
  }

  /**
   * Get films count for pagination
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

    const result = await this.query(sql, params);
    return result[0].count;
  }

  /**
   * Rent a film (create rental record)
   */
  async rentFilm(customerId, inventoryId, staffId = 1) {
    const connection = await this.db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if inventory is available
      const checkSql = `
        SELECT inventory_id 
        FROM inventory 
        WHERE inventory_id = ? 
        AND inventory_id NOT IN (
          SELECT inventory_id FROM rental WHERE return_date IS NULL
        )
      `;
      
      const [available] = await connection.execute(checkSql, [inventoryId]);
      
      if (available.length === 0) {
        throw new Error('Film is not available for rental');
      }

      // Create rental
      const rentalSql = `
        INSERT INTO rental (rental_date, inventory_id, customer_id, staff_id)
        VALUES (NOW(), ?, ?, ?)
      `;
      
      const [rentalResult] = await connection.execute(rentalSql, [inventoryId, customerId, staffId]);

      await connection.commit();
      
      return {
        rentalId: rentalResult.insertId,
        success: true
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = FilmDAO;
