const app = require('./app');
const env = require('./config/env');

const port = env.port;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
