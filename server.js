const express = require('express');

function start() {
  const app = express();

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