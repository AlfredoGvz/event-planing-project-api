const pg = require("pg");
const { Pool } = pg;
const ENV = process.env.NODE_ENV || "development";

require("dotenv").config({
  path: `${__dirname}/../.env.${ENV}`,
});
// const { USER, PASSWORD, DATABASE } = process.env;
// if (!USER || !PASSWORD || !DATABASE) {
//   throw Error("Connection information missing⛔");
// }

const config = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.CA,
  },
};

const pool = new Pool(config);

module.exports = pool;
