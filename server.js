const express = require('express');

function start() {
  const app = express();

  // Middleware pour les en-têtes CORS
  app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next(); // Passe au prochain middleware
  });

  app.get('/', (req, res) => {
    console.log('Got it!');
    res.send('Hello World!');
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = { start };
