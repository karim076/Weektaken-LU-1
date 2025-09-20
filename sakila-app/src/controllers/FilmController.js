const FilmService = require('../services/FilmService');

/**
 * Controller for film operations using service layer
 * Controllers should not contain business logic - only call services
 */
class FilmController {
  constructor() {
    this.filmService = new FilmService();
  }

  /**
   * Show films overview (US1E3)
   */
  index = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 12;
      const search = req.query.search || '';
      const categoryId = req.query.category ? parseInt(req.query.category) : null;

      console.log('Film index - Query params:', {
        page,
        limit,
        search,
        categoryId,
        originalQuery: req.query
      });

      const result = await this.filmService.getFilms(page, limit, search, categoryId);

      if (!result.success) {
        return res.status(500).render('error', {
          title: 'Server Fout',
          status: 500,
          message: result.message
        });
      }

      res.render('films', {
        title: 'Films - Sakila App',
        films: result.data.films,
        categories: result.data.categories,
        pagination: result.data.pagination,
        search,
        selectedCategory: categoryId
      });
    } catch (error) {
      console.error('Film index error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van films'
      });
    }
  };

  /**
   * Show film details page
   */
  show = async (req, res) => {
    try {
      const filmId = parseInt(req.params.id);
      
      if (!filmId || isNaN(filmId)) {
        return res.status(404).render('error', {
          title: 'Film Niet Gevonden',
          status: 404,
          message: 'De opgevraagde film kon niet worden gevonden'
        });
      }

      const result = await this.filmService.getFilmById(filmId);
      
      if (!result.success) {
        return res.status(404).render('error', {
          title: 'Film Niet Gevonden',
          status: 404,
          message: result.message || 'De opgevraagde film kon niet worden gevonden'
        });
      }

      // Get similar films (same category)
      let similarFilms = [];
      if (result.data.film.category_id) {
        const similarResult = await this.filmService.getFilms(1, 5, '', result.data.film.category_id);
        if (similarResult.success) {
          similarFilms = similarResult.data.films.filter(f => f.film_id !== filmId);
        }
      }

      res.render('film-detail', {
        title: `${result.data.film.title} - Sakila Video`,
        film: {
          ...result.data.film,
          stores: result.data.storeInventory || []
        },
        similarFilms: similarFilms,
        user: req.user || null
      });
    } catch (error) {
      console.error('Film detail error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van filmdetails'
      });
    }
  };

  /**
   * Rent a film (US1E2 - Customer rents film)
   */
  rent = async (req, res) => {
    try {
      const filmId = parseInt(req.params.id);
      const storeId = parseInt(req.body.store_id) || 1;
      
      console.log('Film rental attempt:');
      console.log('- Film ID:', filmId);
      console.log('- Store ID:', storeId);
      console.log('- User:', req.user);
      
      if (!req.user || req.user.role !== 'customer') {
        console.log('- Authentication failed, redirecting to login');
        return res.redirect('/login?redirect=/films/' + filmId);
      }

      const customerId = req.user.user_id;
      console.log('- Customer ID:', customerId);

      // Use FilmService to rent the film
      console.log('- Calling filmService.rentFilm...');
      const rentalResult = await this.filmService.rentFilm(customerId, filmId, storeId);
      console.log('- Rental result:', rentalResult);
      
      if (!rentalResult.success) {
        console.log('- Rental failed:', rentalResult.message);
        return res.redirect(`/films/${filmId}?error=${encodeURIComponent(rentalResult.message)}`);
      }

      console.log('- Rental successful, redirecting to customer rentals');
      return res.redirect(`/customer/rentals?success=${encodeURIComponent('Film toegevoegd aan verhuur! Status: In behandeling. Ga naar de winkel om te betalen.')}`);
      
    } catch (error) {
      console.error('Film rental error:', error);
      return res.redirect(`/films/${req.params.id}?error=${encodeURIComponent('Er is een fout opgetreden bij het huren')}`);
    }
  };

  /**
   * Check film availability (AJAX endpoint)
   */
  checkAvailability = async (req, res) => {
    try {
      const filmId = req.params.id;
      const storeId = req.query.storeId ? parseInt(req.query.storeId) : null;

      const result = await this.filmService.checkFilmAvailability(filmId, storeId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Film availability check error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het controleren van beschikbaarheid'
      });
    }
  };

  /**
   * Search films (AJAX endpoint) (US2E3)
   */
  search = async (req, res) => {
    try {
      const { q: searchTerm, category, page = 1 } = req.query;
      const categoryId = category ? parseInt(category) : null;

      const result = await this.filmService.searchFilms(searchTerm, categoryId, page, 12);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Film search error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het zoeken'
      });
    }
  };

  /**
   * Get categories (AJAX endpoint)
   */
  getCategories = async (req, res) => {
    try {
      const result = await this.filmService.getCategories();

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van categorieën'
      });
    }
  };

  /**
   * Owner perspective: Add new film (US1E6)
   */
  showCreate = (req, res) => {
    try {
      res.render('admin/film-create', {
        title: 'Nieuwe Film Toevoegen',
        error: null,
        success: null
      });
    } catch (error) {
      console.error('Film show create error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van het formulier'
      });
    }
  };

  /**
   * Owner perspective: Create film (US1E6)
   */
  create = async (req, res) => {
    try {
      const { title, description, releaseYear, languageId, rentalDuration, rentalRate, length, replacementCost, rating, specialFeatures } = req.body;

      // Validation
      if (!title || !description || !languageId) {
        return res.render('admin/film-create', {
          title: 'Nieuwe Film Toevoegen',
          error: 'Verplichte velden: titel, beschrijving en taal',
          success: null
        });
      }

      const result = await this.filmService.createFilm({
        title,
        description,
        releaseYear: releaseYear || null,
        languageId,
        rentalDuration: rentalDuration || 3,
        rentalRate: rentalRate || 4.99,
        length: length || null,
        replacementCost: replacementCost || 19.99,
        rating: rating || 'G',
        specialFeatures: specialFeatures || null
      });

      if (!result.success) {
        return res.render('admin/film-create', {
          title: 'Nieuwe Film Toevoegen',
          error: result.message,
          success: null
        });
      }

      res.render('admin/film-create', {
        title: 'Nieuwe Film Toevoegen',
        error: null,
        success: 'Film succesvol toegevoegd!'
      });
    } catch (error) {
      console.error('Film create error:', error);
      res.render('admin/film-create', {
        title: 'Nieuwe Film Toevoegen',
        error: 'Er is een fout opgetreden bij het toevoegen van de film',
        success: null
      });
    }
  };
}

module.exports = FilmController;
