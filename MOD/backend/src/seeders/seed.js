require('dotenv').config();
const sequelize = require('../config/database');
const { User, Asset, InventoryItem, Department, Permission, Role } = require('../models');

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Sync all models (force: true will drop existing tables)
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Create admin user
    const admin = await User.create({
      email: 'admin@iirmis.go.tz',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      employeeId: 'EMP001',
      permissions: {
        assets: true,
        maintenance: true,
        repair: true,
        store: true,
        reports: true,
        users: true,
        settings: true
      },
      isActive: true
    });
    console.log('Created admin user:', admin.email);

    // Create sample users
    const usersData = [
      {
        email: 'manager@iirmis.go.tz',
        password: 'manager123',
        firstName: 'Juma',
        lastName: 'Mwangi',
        role: 'manager',
        department: 'Operations',
        position: 'Operations Manager',
        employeeId: 'EMP002',
        permissions: { assets: true, maintenance: true, repair: true, store: true, reports: true, users: false, settings: false },
        isActive: true
      },
      {
        email: 'tech@iirmis.go.tz',
        password: 'tech123',
        firstName: 'Hassan',
        lastName: 'Ali',
        role: 'technician',
        department: 'Maintenance',
        position: 'Senior Technician',
        employeeId: 'EMP003',
        permissions: { assets: true, maintenance: true, repair: true, store: true, reports: false, users: false, settings: false },
        isActive: true
      },
      {
        email: 'user@iirmis.go.tz',
        password: 'user123',
        firstName: 'Amina',
        lastName: 'Mohamed',
        role: 'user',
        department: 'Finance',
        position: 'Accountant',
        employeeId: 'EMP004',
        permissions: { assets: true, maintenance: true, repair: true, store: false, reports: false, users: false, settings: false },
        isActive: true
      }
    ];

    for (const userData of usersData) {
      await User.create(userData);
    }
    console.log(`Created ${usersData.length} sample users`);

    // Create sample assets
    const assetsData = [
      {
        name: 'Dell OptiPlex 7090',
        assetTag: 'COM-000001',
        serialNumber: 'DELL7090001',
        category: 'computer',
        type: 'Desktop Computer',
        manufacturer: 'Dell',
        model: 'OptiPlex 7090',
        department: 'IT',
        location: 'Office A101',
        status: 'in-use',
        condition: 'good',
        acquisitionDate: new Date('2023-01-15'),
        purchasePrice: 2500000,
        currentValue: 2000000,
        warrantyExpiry: new Date('2026-01-15')
      },
      {
        name: 'HP LaserJet Pro',
        assetTag: 'EQP-000002',
        serialNumber: 'HP-LJ-002',
        category: 'equipment',
        type: 'Printer',
        manufacturer: 'HP',
        model: 'LaserJet Pro M404dn',
        department: 'Finance',
        location: 'Office B203',
        status: 'available',
        condition: 'good',
        acquisitionDate: new Date('2023-03-20'),
        purchasePrice: 1200000,
        currentValue: 900000,
        warrantyExpiry: new Date('2025-03-20')
      },
      {
        name: 'Toyota Hiace',
        assetTag: 'VEH-000003',
        serialNumber: 'TOYOTA-HIACE-003',
        category: 'vehicle',
        type: 'Mini Bus',
        manufacturer: 'Toyota',
        model: 'Hiace 2022',
        department: 'Transport',
        location: 'Parking Lot',
        status: 'in-use',
        condition: 'good',
        acquisitionDate: new Date('2022-08-10'),
        purchasePrice: 85000000,
        currentValue: 70000000,
        warrantyExpiry: new Date('2025-08-10')
      },
      {
        name: 'Executive Desk',
        assetTag: 'FUR-000004',
        category: 'furniture',
        type: 'Office Desk',
        manufacturer: 'Local',
        department: 'Admin',
        location: 'Office C301',
        status: 'in-use',
        condition: 'good',
        acquisitionDate: new Date('2021-05-01'),
        purchasePrice: 500000,
        currentValue: 350000
      },
      {
        name: 'Air Conditioner LG',
        assetTag: 'EQP-000005',
        serialNumber: 'LG-AC-005',
        category: 'equipment',
        type: 'Air Conditioner',
        manufacturer: 'LG',
        model: 'Dual Inverter 24000 BTU',
        department: 'Admin',
        location: 'Conference Room',
        status: 'available',
        condition: 'good',
        acquisitionDate: new Date('2023-06-01'),
        purchasePrice: 1800000,
        currentValue: 1500000,
        warrantyExpiry: new Date('2026-06-01')
      }
    ];

    await Asset.bulkCreate(assetsData);
    console.log(`Created ${assetsData.length} sample assets`);

    // Create sample inventory items
    const inventoryData = [
      {
        name: 'Printer Toner HP',
        sku: 'TON-00001',
        category: 'consumables',
        description: 'HP LaserJet Toner Cartridge',
        quantity: 25,
        unit: 'piece',
        unitPrice: 150000,
        reorderPoint: 5,
        location: 'Store Room A',
        isActive: true
      },
      {
        name: 'A4 Paper Ream',
        sku: 'PAP-00002',
        category: 'consumables',
        description: 'A4 Printing Paper 500 sheets',
        quantity: 100,
        unit: 'pack',
        unitPrice: 15000,
        reorderPoint: 20,
        location: 'Store Room A',
        isActive: true
      },
      {
        name: 'Network Cable Cat6',
        sku: 'CAB-00003',
        category: 'accessories',
        description: 'Cat6 Ethernet Cable 1m',
        quantity: 50,
        unit: 'piece',
        unitPrice: 5000,
        reorderPoint: 10,
        location: 'IT Store',
        isActive: true
      },
      {
        name: 'USB Flash Drive 32GB',
        sku: 'USB-00004',
        category: 'accessories',
        description: 'SanDisk USB 3.0 Flash Drive',
        quantity: 30,
        unit: 'piece',
        unitPrice: 25000,
        reorderPoint: 5,
        location: 'IT Store',
        isActive: true
      },
      {
        name: 'Office Chair Wheels',
        sku: 'SPR-00005',
        category: 'spare-parts',
        description: 'Replacement wheels for office chairs',
        quantity: 40,
        unit: 'set',
        unitPrice: 20000,
        reorderPoint: 10,
        location: 'Maintenance Store',
        isActive: true
      }
    ];

    await InventoryItem.bulkCreate(inventoryData);
    console.log(`Created ${inventoryData.length} sample inventory items`);

    // Create sample departments
    const departmentsData = [
      { name: 'Information Technology', code: 'IT', description: 'IT and Systems Department', status: 'active' },
      { name: 'Finance', code: 'FIN', description: 'Finance and Accounting', status: 'active' },
      { name: 'Human Resources', code: 'HR', description: 'Human Resources Management', status: 'active' },
      { name: 'Operations', code: 'OPS', description: 'Operations Department', status: 'active' },
      { name: 'Administration', code: 'ADMIN', description: 'Administrative Services', status: 'active' },
      { name: 'Maintenance', code: 'MAINT', description: 'Maintenance and Repairs', status: 'active' },
      { name: 'Transport', code: 'TRANS', description: 'Transport and Logistics', status: 'active' },
      { name: 'Procurement', code: 'PROC', description: 'Procurement and Supply', status: 'active' }
    ];

    await Department.bulkCreate(departmentsData);
    console.log(`Created ${departmentsData.length} departments`);

    // Create sample permissions
    const permissionsData = [
      { name: 'View Assets', code: 'assets.view', module: 'Assets', description: 'View all assets', status: 'active' },
      { name: 'Create Assets', code: 'assets.create', module: 'Assets', description: 'Create new assets', status: 'active' },
      { name: 'Edit Assets', code: 'assets.edit', module: 'Assets', description: 'Edit existing assets', status: 'active' },
      { name: 'Delete Assets', code: 'assets.delete', module: 'Assets', description: 'Delete assets', status: 'active' },
      { name: 'View Maintenance', code: 'maintenance.view', module: 'Maintenance', description: 'View maintenance records', status: 'active' },
      { name: 'Create Maintenance', code: 'maintenance.create', module: 'Maintenance', description: 'Create maintenance requests', status: 'active' },
      { name: 'View Reports', code: 'reports.view', module: 'Reports', description: 'View all reports', status: 'active' },
      { name: 'Export Reports', code: 'reports.export', module: 'Reports', description: 'Export reports', status: 'active' },
      { name: 'Manage Users', code: 'users.manage', module: 'Users', description: 'Manage system users', status: 'active' },
      { name: 'System Settings', code: 'settings.manage', module: 'Settings', description: 'Manage system settings', status: 'active' }
    ];

    await Permission.bulkCreate(permissionsData);
    console.log(`Created ${permissionsData.length} permissions`);

    // Create sample roles
    const rolesData = [
      { 
        name: 'Administrator', 
        code: 'admin', 
        description: 'Full system access', 
        permissions: ['assets.view', 'assets.create', 'assets.edit', 'assets.delete', 'maintenance.view', 'maintenance.create', 'reports.view', 'reports.export', 'users.manage', 'settings.manage'],
        userCount: 1,
        status: 'active' 
      },
      { 
        name: 'Manager', 
        code: 'manager', 
        description: 'Department management access', 
        permissions: ['assets.view', 'assets.create', 'assets.edit', 'maintenance.view', 'maintenance.create', 'reports.view', 'reports.export'],
        userCount: 2,
        status: 'active' 
      },
      { 
        name: 'Technician', 
        code: 'technician', 
        description: 'Maintenance and repair access', 
        permissions: ['assets.view', 'maintenance.view', 'maintenance.create'],
        userCount: 3,
        status: 'active' 
      },
      { 
        name: 'User', 
        code: 'user', 
        description: 'Basic user access', 
        permissions: ['assets.view', 'maintenance.view'],
        userCount: 10,
        status: 'active' 
      }
    ];

    await Role.bulkCreate(rolesData);
    console.log(`Created ${rolesData.length} roles`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@iirmis.go.tz / admin123');
    console.log('Manager: manager@iirmis.go.tz / manager123');
    console.log('Technician: tech@iirmis.go.tz / tech123');
    console.log('User: user@iirmis.go.tz / user123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
