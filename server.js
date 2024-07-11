const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
const localdb = process.env.DATABASE_LOCAL;

mongoose.connect(DB, {}).then(() => {
  console.log('DB connection is successful');
});

const port = process.env.PORT || 9000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`server listening on ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandled rejection? Shutting down server');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception? Shutting down server');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
