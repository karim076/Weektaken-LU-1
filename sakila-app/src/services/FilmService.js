const FilmDAO = require('../dao/FilmDAO');

/**
 * Service for film business logic
 */
class FilmService {
  constructor() {
    this.filmDAO = new FilmDAO();
  }

  /**
   * Get films with pagination and filtering
   */
  async getFilms(page = 1, limit = 12, search = '', categoryId = null) {
    try {
      const films = await this.filmDAO.getFilmsWithDetails(page, limit, search, categoryId);
      const totalCount = await this.filmDAO.getFilmsCount(search, categoryId);
      const categories = await this.filmDAO.getAllCategories();

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          films,
          categories,
          pagination: {
            page,
            totalPages,
            total: totalCount,
            limit
          }
        }
      };
    } catch (error) {
      console.error('Get films error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van films'
      };
    }
  }

  /**
   * Get film details with all related information
   */
  async getFilmDetails(filmId) {
    try {
      const film = await this.filmDAO.getFilmDetails(filmId);
      
      if (!film) {
        return {
          success: false,
          message: 'Film niet gevonden'
        };
      }

      // Get additional details
      const [actors, filmText, storeInventory] = await Promise.all([
        this.filmDAO.getFilmActors(filmId),
        this.filmDAO.getFilmText(filmId),
        this.filmDAO.getFilmStoreInventory(filmId)
      ]);

      return {
        success: true,
        data: {
          film,
          actors,
          filmText,
          storeInventory
        }
      };
    } catch (error) {
      console.error('Get film details error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van filmgegevens'
      };
    }
  }

  /**
   * Rent a film
   */
  async rentFilm(customerId, filmId, storeId = null) {
    try {
      // Find available inventory for the film
      const inventoryQuery = `
        SELECT i.inventory_id 
        FROM inventory i 
        WHERE i.film_id = ? 
        ${storeId ? 'AND i.store_id = ?' : ''}
        AND i.inventory_id NOT IN (
          SELECT inventory_id FROM rental WHERE return_date IS NULL
        )
        LIMIT 1
      `;
      
      const params = storeId ? [filmId, storeId] : [filmId];
      const inventory = await this.filmDAO.query(inventoryQuery, params);
      
      if (inventory.length === 0) {
        return {
          success: false,
          message: 'Film is momenteel niet beschikbaar voor verhuur'
        };
      }

      const inventoryId = inventory[0].inventory_id;
      
      // Create rental
      const result = await this.filmDAO.rentFilm(customerId, inventoryId);
      
      return {
        success: true,
        data: {
          rentalId: result.rentalId
        },
        message: 'Film succesvol gehuurd'
      };
    } catch (error) {
      console.error('Rent film error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het huren van de film'
      };
    }
  }

  /**
   * Get available films for rental
   */
  async getAvailableFilms(page = 1, limit = 12, search = '', categoryId = null) {
    try {
      const result = await this.getFilms(page, limit, search, categoryId);
      
      if (result.success) {
        // Filter only available films
        result.data.films = result.data.films.filter(film => film.available_copies > 0);
      }
      
      return result;
    } catch (error) {
      console.error('Get available films error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van beschikbare films'
      };
    }
  }

  /**
   * Get categories
   */
  async getCategories() {
    try {
      const categories = await this.filmDAO.getAllCategories();
      
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van categorieën'
      };
    }
  }

  /**
   * Search films
   */
  async searchFilms(searchTerm, categoryId = null, page = 1, limit = 12) {
    try {
      return await this.getFilms(page, limit, searchTerm, categoryId);
    } catch (error) {
      console.error('Search films error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het zoeken naar films'
      };
    }
  }

  /**
   * Check film availability
   */
  async checkFilmAvailability(filmId, storeId = null) {
    try {
      const storeInventory = await this.filmDAO.getFilmStoreInventory(filmId);
      
      if (storeId) {
        const store = storeInventory.find(s => s.store_id === storeId);
        return {
          success: true,
          data: {
            available: store ? store.available_copies > 0 : false,
            availableCopies: store ? store.available_copies : 0,
            totalCopies: store ? store.total_copies : 0
          }
        };
      }
      
      const totalAvailable = storeInventory.reduce((sum, store) => sum + store.available_copies, 0);
      const totalCopies = storeInventory.reduce((sum, store) => sum + store.total_copies, 0);
      
      return {
        success: true,
        data: {
          available: totalAvailable > 0,
          availableCopies: totalAvailable,
          totalCopies: totalCopies,
          storeInventory
        }
      };
    } catch (error) {
      console.error('Check film availability error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het controleren van beschikbaarheid'
      };
    }
  }
}

module.exports = FilmService;
