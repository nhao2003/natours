const mongoose = require('mongoose');
const dotenv = require('dotenv');
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log(err.stack);
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  process.exit(1);
}
);
const port = process.env.PORT || 8000;
dotenv.config({ path: './config.env' });
const app = require('./app');
const DB = process.env.DATABASE.replace(
  '<DATABASE_PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
console.log(process.env.NODE_ENV);
mongoose.connect(DB).then(() => {
  console.log('DB connection successful!');
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});