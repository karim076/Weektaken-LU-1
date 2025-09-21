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
  index = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const search = req.query.search || '';
    const category = req.query.category ? parseInt(req.query.category) : null; // Blijf 'category' gebruiken
    const rating = req.query.rating || '';
    const year = req.query.year ? parseInt(req.query.year) : null;
    const length = req.query.length || '';
    const priceRange = req.query.priceRange || '';
    const sortBy = req.query.sortBy || 'title';

  // Gebruik dezelfde parameter namen als in frontend
  const filters = {};
    if (search && search !== '') filters.search = search;
    if (category !== null && category !== '' && !isNaN(category)) filters.category = category; // Gebruik 'category' i.p.v. 'categoryId'
    if (rating && rating !== '') filters.rating = rating;
    if (year !== null && year !== '' && !isNaN(year)) filters.year = year;
    if (length && length !== '') filters.length = length;
    if (priceRange && priceRange !== '') filters.priceRange = priceRange;
    if (sortBy && sortBy !== '') filters.sortBy = sortBy;

  console.log('Film index - Query params:', {
    page,
    limit,
    filters,
    originalQuery: req.query
  });

    this.filmService.getFilmsAdvanced(page, limit, filters, (error, result) => {
      if (error) {
        console.error('Film index error:', error);
        return res.status(500).render('error', {
          title: 'Server Fout',
          status: 500,
          message: 'Er is een fout opgetreden bij het laden van films'
        });
      }

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
        years: result.data.years,
        pagination: result.data.pagination,
        search,
        selectedCategory: category,
        selectedRating: rating,
        selectedYear: year,
        selectedLength: length,
        selectedPriceRange: priceRange,
        selectedSort: sortBy
      });
    });
  }

  /**
   * Show film details page
   */
  show = (req, res) => {
    const filmId = parseInt(req.params.id);
    
    if (!filmId || isNaN(filmId)) {
      return res.status(404).render('error', {
        title: 'Film Niet Gevonden',
        status: 404,
        message: 'De opgevraagde film kon niet worden gevonden'
      });
    }

    this.filmService.getFilmById(filmId, (error, result) => {
      if (error) {
        console.error('Film show error:', error);
        return res.status(500).render('error', {
          title: 'Server Fout',
          status: 500,
          message: 'Er is een fout opgetreden bij het laden van de film'
        });
      }
      
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
        this.filmService.getFilms(1, 5, '', result.data.film.category_id, (similarError, similarResult) => {
          if (similarError) {
            console.error('Error getting similar films:', similarError);
          } else if (similarResult.success) {
            similarFilms = similarResult.data.films.filter(f => f.film_id !== filmId);
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
        });
      } else {
        res.render('film-detail', {
          title: `${result.data.film.title} - Sakila Video`,
          film: {
            ...result.data.film,
            stores: result.data.storeInventory || []
          },
          similarFilms: similarFilms,
          user: req.user || null
        });
      }
    });
  }

  /**
   * Rent a film (US1E2 - Customer rents film)
   */
  rent = (req, res) => {
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
    this.filmService.rentFilm(customerId, filmId, storeId, (error, rentalResult) => {
      if (error) {
        console.error('Film rent error:', error);
        return res.redirect(`/films/${filmId}?error=${encodeURIComponent('Er is een fout opgetreden bij het huren van de film')}`);
      }
      
      console.log('- Rental result:', rentalResult);
      
      if (!rentalResult.success) {
        console.log('- Rental failed:', rentalResult.message);
        return res.redirect(`/films/${filmId}?error=${encodeURIComponent(rentalResult.message)}`);
      }

      console.log('- Rental successful, redirecting to customer rentals');
      return res.redirect(`/customer/rentals?success=${encodeURIComponent('Film toegevoegd aan verhuur! Status: In behandeling. Ga naar de winkel om te betalen.')}`);
    });
  }

  /**
   * Check film availability (AJAX endpoint)
   */
  checkAvailability = (req, res) => {
    const filmId = req.params.id;
    const storeId = req.query.storeId ? parseInt(req.query.storeId) : null;

    this.filmService.checkFilmAvailability(filmId, storeId, (error, result) => {
      if (error) {
        console.error('Film availability check error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het controleren van beschikbaarheid'
        });
      }

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
    });
  }

  /**
   * Search films (AJAX endpoint) (US2E3)
   */
  search = (req, res) => {
    const { q: searchTerm, category, page = 1 } = req.query;
    const categoryId = category ? parseInt(category) : null;

    this.filmService.searchFilms(searchTerm, categoryId, page, 12, (error, result) => {
      if (error) {
        console.error('Film search error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het zoeken naar films'
        });
      }

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
    });
  }

  /**
   * Get categories (AJAX endpoint)
   */
  getCategories = (req, res) => {
    this.filmService.getCategories((error, result) => {
      if (error) {
        console.error('Get categories error:', error);
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het ophalen van categorieën'
        });
      }

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
    });
  }

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
  create = (req, res) => {
    const { title, description, releaseYear, languageId, rentalDuration, rentalRate, length, replacementCost, rating, specialFeatures } = req.body;

    // Validation
    if (!title || !description || !languageId) {
      return res.render('admin/film-create', {
        title: 'Nieuwe Film Toevoegen',
        error: 'Verplichte velden: titel, beschrijving en taal',
        success: null
      });
    }

    this.filmService.createFilm({
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
    }, (error, result) => {
      if (error) {
        console.error('Film create error:', error);
        return res.render('admin/film-create', {
          title: 'Nieuwe Film Toevoegen',
          error: 'Er is een fout opgetreden bij het toevoegen van de film',
          success: null
        });
      }

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
    });
  }
}

module.exports = FilmController;
