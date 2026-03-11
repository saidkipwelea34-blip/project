const { Sequelize } = require('sequelize');
const config = require('./index');

console.log('Password is 12345:', config.database.password === '12345');
console.log('DB Config:', { name: config.database.name, user: config.database.user, port: config.database.port, host: config.database.host });
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

module.exports = sequelize;
