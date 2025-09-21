const FilmDAO = require('../dao/FilmDAO');

/**
 * Service for film business logic
 * Contains no database access - delegates to DAO layer
 */
class FilmService {
  constructor() {
    this.filmDAO = new FilmDAO();
    this.rentalService = null; // Lazy load to avoid circular dependency
  }

  /**
   * Lazy load RentalService to avoid circular dependency
   */
  getRentalService() {
    if (!this.rentalService) {
      const RentalService = require('./RentalService');
      this.rentalService = new RentalService();
    }
    return this.rentalService;
  }

  /**
   * Get films with advanced filtering
   */
  getFilmsAdvanced(page = 1, limit = 12, filters = {}, callback) {
    // Zorg dat filters de juiste properties heeft
    const effectiveFilters = {
      search: filters.search || '',
      categoryId: filters.categoryId || null,
      rating: filters.rating || '',
      year: filters.year || null,
      length: filters.length || '',
      priceRange: filters.priceRange || '',
      sortBy: filters.sortBy || 'title'
    };
    this.filmDAO.getFilmsWithAdvancedFilters(page, limit, effectiveFilters, (error, films) => {
      if (error) {
        console.error('Get films advanced error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van films'
        });
      }

      this.filmDAO.getFilmsCountAdvanced(filters, (countError, totalCount) => {
        if (countError) {
          console.error('Get films count advanced error:', countError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het ophalen van films'
          });
        }

        this.filmDAO.getAllCategories((categoriesError, categories) => {
          if (categoriesError) {
            console.error('Get categories error:', categoriesError);
            return callback(null, {
              success: false,
              message: 'Er is een fout opgetreden bij het ophalen van films'
            });
          }

          this.filmDAO.getUniqueYears((yearsError, years) => {
            if (yearsError) {
              console.error('Get years error:', yearsError);
              return callback(null, {
                success: false,
                message: 'Er is een fout opgetreden bij het ophalen van films'
              });
            }

            const totalPages = Math.ceil(totalCount / limit);

            callback(null, {
              success: true,
              data: {
                films,
                categories,
                years,
                pagination: {
                  page,
                  totalPages,
                  total: totalCount,
                  limit
                }
              }
            });
          });
        });
      });
    });
  }

  /**
   * Get films with pagination and filtering
   */
  getFilms(page = 1, limit = 12, search = '', categoryId = null, callback) {
    this.filmDAO.getFilmsWithDetails(page, limit, search, categoryId, 'title', (error, films) => {
      if (error) {
        console.error('Get films error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van films'
        });
      }

      this.filmDAO.getFilmsCount(search, categoryId, (countError, totalCount) => {
        if (countError) {
          console.error('Get films count error:', countError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het ophalen van films'
          });
        }

        this.filmDAO.getAllCategories((categoriesError, categories) => {
          if (categoriesError) {
            console.error('Get categories error:', categoriesError);
            return callback(null, {
              success: false,
              message: 'Er is een fout opgetreden bij het ophalen van films'
            });
          }

          const totalPages = Math.ceil(totalCount / limit);

          callback(null, {
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
          });
        });
      });
    });
  }

  /**
   * Get film details with all related information
   */
  getFilmDetails(filmId, callback) {
    this.filmDAO.getFilmDetails(filmId, (error, film) => {
      if (error) {
        console.error('Get film details error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van filmgegevens'
        });
      }
      
      if (!film) {
        return callback(null, {
          success: false,
          message: 'Film niet gevonden'
        });
      }

      // Get additional details
      this.filmDAO.getFilmActors(filmId, (actorsError, actors) => {
        if (actorsError) {
          console.error('Get film actors error:', actorsError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het ophalen van filmgegevens'
          });
        }

        this.filmDAO.getFilmText(filmId, (textError, filmText) => {
          if (textError) {
            console.error('Get film text error:', textError);
            return callback(null, {
              success: false,
              message: 'Er is een fout opgetreden bij het ophalen van filmgegevens'
            });
          }

          this.filmDAO.getFilmStoreInventory(filmId, (inventoryError, storeInventory) => {
            if (inventoryError) {
              console.error('Get film store inventory error:', inventoryError);
              return callback(null, {
                success: false,
                message: 'Er is een fout opgetreden bij het ophalen van filmgegevens'
              });
            }

            callback(null, {
              success: true,
              data: {
                film,
                actors,
                filmText,
                storeInventory
              }
            });
          });
        });
      });
    });
  }

  /**
   * Rent a film
   */
  rentFilm(customerId, filmId, storeId = null, callback) {
    console.log(`FilmService.rentFilm called with: customerId=${customerId}, filmId=${filmId}, storeId=${storeId}`);
    
    // First find available inventory for this film using filmDAO
    this.filmDAO.getAvailableInventory(filmId, storeId || 1, (error, availableInventory) => {
      if (error) {
        console.error('Rent film error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het huren van de film'
        });
      }

      if (!availableInventory.length) {
        return callback(null, {
          success: false,
          message: 'Geen beschikbare exemplaren van deze film'
        });
      }

      const inventoryId = availableInventory[0].inventory_id;
      console.log('Found available inventory ID:', inventoryId);
      
      // Use RentalService for proper status handling
      this.getRentalService().createRental(customerId, inventoryId, 1, (rentalError, result) => {
        if (rentalError) {
          console.error('RentalService.createRental error:', rentalError);
          return callback(null, {
            success: false,
            message: rentalError.message || 'Er is een fout opgetreden bij het huren van de film'
          });
        }
        
        console.log('RentalService.createRental result:', result);
        
        callback(null, {
          success: true,
          data: {
            rentalId: result.rental_id
          },
          message: result.message || 'Film succesvol gehuurd'
        });
      });
    });
  }

  /**
   * Get available films for rental
   */
  getAvailableFilms(page = 1, limit = 12, search = '', categoryId = null, callback) {
    this.getFilms(page, limit, search, categoryId, (error, result) => {
      if (error) {
        console.error('Get available films error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van beschikbare films'
        });
      }
      
      if (result.success) {
        // Filter only available films
        result.data.films = result.data.films.filter(film => film.available_copies > 0);
      }
      
      callback(null, result);
    });
  }

  /**
   * Get categories
   */
  getCategories(callback) {
    this.filmDAO.getAllCategories((error, categories) => {
      if (error) {
        console.error('Get categories error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van categorieën'
        });
      }
      
      callback(null, {
        success: true,
        data: categories
      });
    });
  }

  /**
   * Search films
   */
  searchFilms(searchTerm, categoryId = null, page = 1, limit = 12, callback) {
    this.getFilms(page, limit, searchTerm, categoryId, callback);
  }

  /**
   * Check film availability
   */
  checkFilmAvailability(filmId, storeId = null, callback) {
    this.filmDAO.getFilmStoreInventory(filmId, (error, storeInventory) => {
      if (error) {
        console.error('Check film availability error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het controleren van beschikbaarheid'
        });
      }
      
      if (storeId) {
        const store = storeInventory.find(s => s.store_id === storeId);
        return callback(null, {
          success: true,
          data: {
            available: store ? store.available_copies > 0 : false,
            availableCopies: store ? store.available_copies : 0,
            totalCopies: store ? store.total_copies : 0
          }
        });
      }
      
      const totalAvailable = storeInventory.reduce((sum, store) => sum + store.available_copies, 0);
      const totalCopies = storeInventory.reduce((sum, store) => sum + store.total_copies, 0);
      
      callback(null, {
        success: true,
        data: {
          available: totalAvailable > 0,
          availableCopies: totalAvailable,
          totalCopies: totalCopies,
          storeInventory
        }
      });
    });
  }

  /**
   * Get popular films for homepage
   */
  getPopularFilms(page = 1, limit = 12, callback) {
    // Gebruik de nieuwe getPopularFilms DAO methode
    this.filmDAO.getPopularFilms(limit, (error, films) => {
      if (error) {
        console.error('Get popular films error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van populaire films'
        });
      }

      this.filmDAO.getFilmsCount('', null, (countError, totalCount) => {
        if (countError) {
          console.error('Get films count error:', countError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het ophalen van populaire films'
          });
        }

        const totalPages = Math.ceil(totalCount / limit);

        callback(null, {
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
        });
      });
    });
  }

  /**
   * Get total number of films
   */
  getTotalFilms(callback) {
    this.filmDAO.getFilmsCount('', null, (error, count) => {
      if (error) {
        console.error('Get total films error:', error);
        return callback(null, 0);
      }
      callback(null, count);
    });
  }

  /**
   * Get single film by ID with all details
   */
  getFilmById(filmId, callback) {
    this.filmDAO.getFilmWithDetails(filmId, (error, film) => {
      if (error) {
        console.error('Get film by ID error:', error);
        return callback(null, {
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van filmdetails'
        });
      }
      
      if (!film) {
        return callback(null, {
          success: false,
          message: 'Film niet gevonden'
        });
      }

      // Get store inventory information
      this.filmDAO.getFilmStoreInventory(filmId, (inventoryError, storeInventory) => {
        if (inventoryError) {
          console.error('Get film store inventory error:', inventoryError);
          return callback(null, {
            success: false,
            message: 'Er is een fout opgetreden bij het ophalen van filmdetails'
          });
        }

        callback(null, {
          success: true,
          data: {
            film: film,
            storeInventory: storeInventory
          }
        });
      });
    });
  }

  /**
   * Check film availability in specific store
   */
  checkStoreAvailability(filmId, storeId, callback) {
    this.filmDAO.checkStoreAvailability(filmId, storeId, (error, availability) => {
      if (error) {
        console.error('Check availability error:', error);
        return callback(null, {
          success: false,
          message: 'Kan beschikbaarheid niet controleren'
        });
      }

      callback(null, {
        success: true,
        data: availability
      });
    });
  }

  /**
   * Search films for staff interface
   */
  searchFilmsForStaff(query, callback) {
    this.filmDAO.searchAvailableFilms(query, (error, films) => {
      if (error) {
        console.error('FilmService searchFilmsForStaff error:', error);
        return callback(null, []);
      }
      callback(null, films);
    });
  }

}

module.exports = FilmService;