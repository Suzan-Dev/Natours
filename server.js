const mongoose = require('mongoose');
require('dotenv').config();

// global error handler
// uncaught Exceptions - sync
process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('Uncaught Exception! Shutting down the server...');
  process.exit(1);
});

const app = require('./app');
// console.log(app.get('env')); // express

const db = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('Database connected!'));

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// global error handler
// unhandled Rejections - async
process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('Unhandled Rejection! Shutting down the server...');
  server.close(() => {
    process.exit(1);
  });
});
