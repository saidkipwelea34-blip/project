const fs = require('fs');
console.log('Raw .env content:', fs.readFileSync('.env').toString());
const result = require('dotenv').config({ override: true });
const path = require('path');
console.log('CWD:', process.cwd());
console.log('.env path:', path.resolve(process.cwd(), '.env'));
if (result.error) {
  console.error('Error loading .env:', result.error);
}
console.log('Loaded DB_PASSWORD from env:', JSON.stringify(process.env.DB_PASSWORD));
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { authenticate } = require('./middleware/auth.middleware');

// Import routes
const userRoutes = require('./routes/users.routes');
const assetRoutes = require('./routes/assets.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const repairRoutes = require('./routes/repair.routes');
const storeRoutes = require('./routes/store.routes');
const reportRoutes = require('./routes/reports.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const settingsRoutes = require('./routes/settings.routes');
const serviceRequestRoutes = require('./routes/service-requests.routes');
const accessoryRequestRoutes = require('./routes/accessory-requests.routes');
const departmentRoutes = require('./routes/departments.routes');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/service-requests', authenticate, serviceRequestRoutes);
app.use('/api/accessory-requests', authenticate, accessoryRequestRoutes);
app.use('/api/departments', departmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'IIRMIS API is running', database: 'PostgreSQL' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint haipatikani' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connected successfully');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ Database synchronized');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API docs: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection error:');
    console.error('Message:', err.message);
    console.error('Details:', err.original ? err.original.message : 'No additional details');
    console.error('Code:', err.original ? err.original.code : 'Unknown');
    process.exit(1);
  });

module.exports = app;
