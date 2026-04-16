const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const errorMiddleware = require('./middleware/error.middleware');
const apiRoutes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow all localhost and file-based dev servers
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// TEST ROUTE
app.get('/api/test', (req, res) => {
  res.send('API working');
});

// API routes
app.use('/api', apiRoutes);

// Error handler
app.use(errorMiddleware);

module.exports = app;
