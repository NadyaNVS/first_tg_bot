const dbConfig = require("./db.config");

const { Sequelize } = require("sequelize");

module.exports = new Sequelize("sqlite::memory:", {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
});
