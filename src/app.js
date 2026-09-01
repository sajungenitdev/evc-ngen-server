// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // ✅ Add this
const fs = require('fs'); // ✅ Add this
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const accessoryRoutes = require('./routes/accessory.routes');
const brandRoutes = require('./routes/brand.routes');
const serviceRoutes = require('./routes/service.routes');
const categoryRoutes = require('./routes/category.routes');
const surveyRoutes = require('./routes/survey.routes');
const contactRoutes = require('./routes/contact.routes');
const serviceCategoryRoutes = require('./routes/serviceCategory.routes');
const solutionRoutes = require('./routes/solution.routes');
const industryRoutes = require('./routes/industry.routes');
const trainingRoutes = require('./routes/training.routes');
const trainingCategoryRoutes = require('./routes/trainingCategory.routes');
const heroSectionRoutes = require('./routes/heroSection.routes');
const statsRoutes = require('./routes/stats.routes');
const foundationRoutes = require('./routes/foundation.routes');
const aboutRoutes = require('./routes/about.routes');
const solutionSectionRoutes = require('./routes/solutionSection.routes');








const app = express();

// Connect to database
connectDB();

// ============================================
// ✅ SERVE STATIC FILES FROM UPLOADS DIRECTORY
// ============================================
// The uploads folder is at the root level (one level up from src)
const uploadsPath = path.join(__dirname, '../uploads');
console.log(`📁 Serving static files from: ${uploadsPath}`);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`📁 Created uploads directory: ${uploadsPath}`);
}

// Create products subdirectory if it doesn't exist
const productsPath = path.join(uploadsPath, 'products');
if (!fs.existsSync(productsPath)) {
    fs.mkdirSync(productsPath, { recursive: true });
    console.log(`📁 Created products directory: ${productsPath}`);
}

// Serve static files
app.use('/uploads', express.static(uploadsPath));

// Optional: Add a test route to check images
app.get('/test-images', (req, res) => {
    try {
        const files = fs.readdirSync(productsPath);
        res.json({
            success: true,
            message: 'Images available',
            path: productsPath,
            count: files.length,
            files: files.slice(0, 20) // Show first 20 files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// MIDDLEWARE - WITH BODY SIZE LIMITS FOR IMAGES
// ============================================
app.use(cors());

// ✅ INCREASE BODY SIZE LIMIT FOR IMAGES (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        const contentLength = req.headers['content-length'];
        if (contentLength) {
            const sizeInMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
            console.log(`📦 Body size: ${sizeInMB} MB`);
        }
    }
    next();
});

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'EVNGEN API Server',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            accessories: '/api/accessories',
            brands: '/api/brands',
            categories: '/api/categories',
            services: '/api/services',
            training: '/api/training',
            surveys: '/api/surveys',
            contacts: '/api/contacts',
            'service-categories': '/api/service-categories',
            health: '/health',
            'test-images': '/test-images'
        },
        documentation: 'http://localhost:5000/health'
    });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/accessories', accessoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/solutions', solutionRoutes);
app.use('/api/industries', industryRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/training-categories', trainingCategoryRoutes);
app.use('/api/hero', heroSectionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/foundation', foundationRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/solutions-section', solutionSectionRoutes);


// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

module.exports = app;