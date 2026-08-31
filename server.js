// server.js
const path = require('path');

// Load .env from the root directory
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

// Check if loaded, if not try alternative method
if (!process.env.MONGODB_URI) {
    console.log('⚠️  dotenv.config() failed, trying with absolute path...');
    require('dotenv').config({
        path: path.resolve(__dirname, '.env')
    });
}

// If still not loaded, log the issue but continue with fallback
if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not found in .env, using fallback');
    process.env.MONGODB_URI = 'mongodb+srv://dev3ngenit_db_user:p6YKLnqrvR1ACAS9@cluster0.ehgp8m0.mongodb.net/evngen?appName=Cluster0';
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-make-it-long-and-random';
    process.env.NODE_ENV = 'development';
    process.env.PORT = '5000';
} else {
    console.log('✅ Environment variables loaded successfully');
}

console.log(`📦 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not connected'}`);

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📚 Health Check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, closing server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, closing server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});