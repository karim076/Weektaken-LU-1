const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Bootstrap en CSS
app.use(express.static(path.join(__dirname, 'public')));

// View engine instellen (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Basisroute
app.get('/', (req, res) => {
  res.render('home');
});
const customerRoutes = require('./routes/customers');
app.use('/customers', customerRoutes);


app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});
