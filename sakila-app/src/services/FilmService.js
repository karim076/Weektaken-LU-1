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
      console.log(`FilmService.rentFilm called with: customerId=${customerId}, filmId=${filmId}, storeId=${storeId}`);
      
      // Use the FilmDAO createRental method instead of custom logic
      const result = await this.filmDAO.createRental(filmId, customerId, storeId || 1);
      
      console.log('FilmDAO.createRental result:', result);
      
      return {
        success: true,
        data: {
          rentalId: result.rentalId || result.insertId
        },
        message: 'Film succesvol gehuurd'
      };
    } catch (error) {
      console.error('Rent film error:', error.message);
      return {
        success: false,
        message: error.message || 'Er is een fout opgetreden bij het huren van de film'
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

  /**
   * Get popular films for homepage
   */
  async getPopularFilms(page = 1, limit = 12) {
    try {
      // Gebruik de nieuwe getPopularFilms DAO methode
      const films = await this.filmDAO.getPopularFilms(limit);
      const totalCount = await this.filmDAO.getFilmsCount('', null);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          films,
          pagination: {
            page,
            totalPages,
            total: totalCount,
            limit
          }
        }
      };
    } catch (error) {
      console.error('Get popular films error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van populaire films'
      };
    }
  }

  /**
   * Get total number of films
   */
  async getTotalFilms() {
    try {
      return await this.filmDAO.getFilmsCount('', null);
    } catch (error) {
      console.error('Get total films error:', error);
      return 0;
    }
  }

  /**
   * Get single film by ID with all details
   */
  async getFilmById(filmId) {
    try {
      const film = await this.filmDAO.getFilmWithDetails(filmId);
      
      if (!film) {
        return {
          success: false,
          message: 'Film niet gevonden'
        };
      }

      // Get store inventory information
      const storeInventory = await this.filmDAO.getFilmStoreInventory(filmId);

      return {
        success: true,
        data: {
          film: film,
          storeInventory: storeInventory
        }
      };
    } catch (error) {
      console.error('Get film by ID error:', error);
      return {
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van filmdetails'
      };
    }
  }

  /**
   * Check film availability in specific store
   */
  async checkFilmAvailability(filmId, storeId) {
    try {
      const availability = await this.filmDAO.checkStoreAvailability(filmId, storeId);
      return {
        success: true,
        data: availability
      };
    } catch (error) {
      console.error('Check availability error:', error);
      return {
        success: false,
        message: 'Kan beschikbaarheid niet controleren'
      };
    }
  }

}

module.exports = FilmService;