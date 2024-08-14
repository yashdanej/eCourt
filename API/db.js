const mysql = require("mysql");

const db = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "Yash@1212888",
    database: "pappapi"
    // connectionLimit: 10,
    // host: "localhost",
    // user: "root",
    // password: "Albatros_Med_@2024hash",
    // database: "pappapi"
});

module.exports = db;