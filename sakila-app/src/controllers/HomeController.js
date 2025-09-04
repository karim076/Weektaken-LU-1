class HomeController {
  // GET /
  index(req, res) {
    try {
      res.render('home', {
        title: 'Welkom - Sakila App',
        message: 'Welkom bij de Sakila App 🎬',
        user: req.user || null
      });
    } catch (error) {
      console.error('Home controller error:', error);
      res.status(500).render('error', { 
        title: 'Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van de homepagina.',
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      });
    }
  }
}

module.exports = HomeController;
