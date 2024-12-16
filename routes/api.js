const express = require("express")
const { body, validationResult } = require('express-validator');
const { validateAndSanitiseFunds } = require('../middleware/validateAndSanitiseInput');
const { validateAndSanitisePrices } = require('../middleware/validateAndSanitiseInput');
const router = express.Router()

// Security. Import express-rate-limit so we can stop 
// over use of the API which could cause and denial of service
const rateLimit = require('express-rate-limit');
const apiRateLimiter = rateLimit({
    windowMs: 3 * 60 * 1000,             // 3 minutes before retry
    max: 20,                             // limit each IP to 20 api requests per minute
    message: '{error: "Rate Limited", message: "Thank you for using the Fund Tracker API! Our standard API rate limit is 20 requests per minute. Please wait 3 minutes before trying again."}'
});

// gets a list of all funds from the database
// no authentication checks as is public API
// no validation and sanitisation as no parameters
router.get('/funds', apiRateLimiter ,function (req, res, next) {
    // query database to get all the funds

    let sqlquery = "SELECT * FROM funds"
    // execute the sql query
    db.query(sqlquery, (err, result) => {
        // return results as a JSON object
        if (err) {            
            console.error("Database error:", err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "An error occurred while querying the database."
            });            
            next(err)
        }
        // where no funds are found
        if (result.length === 0) {
            res.status(404).json({
                error: "Not Found",
                message: "No funds found in the database."
            });
        } else {
            // Successful response
            res.status(200).json(result);
        }
    })
});

// gets latest price for the ticker specified
// no authentication checks as is public API
// validation and sanitisation for ticker
// takes one parameter ticker
router.get('/price', validateAndSanitisePrices, function (req, res, next) {
    // check for any validation errors
    let ticker = req.query.ticker
    if (req.validationErrors) {
        console.log('during validation: ' + ticker + " " + req.validationErrors)
        return res.status(400).json(req.validationErrors)
    }
    // query database to get all the funds
    let sqlquery = "SELECT price_date AS date, close AS price FROM prices WHERE ticker = ? ORDER BY price_date DESC LIMIT 1"
    // execute the sql query
    db.query(sqlquery, [ticker], (err, result) => {
        if (err) {            
            console.error("Database error:", err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "An error occurred while querying the database."
            });            
            next(err)
        }
        // where no records are found
        if (result.length === 0) {
            res.status(404).json({
                error: "Not Found",
                message: "That ticker could not be found in the database."
            });
        } else {
            // Successful response
            res.status(200).json(result);
        }
    })
});

router.get('/funds-search', validateAndSanitiseFunds, function (req, res, next) {
    // check for any validation errors
    let search_text = '%'+req.query.search_text+'%'
    if (req.validationErrors) {
        return res.status(400).json(req.validationErrors)
    }
    // query database to get all the funds
    let sqlquery = "SELECT * FROM funds WHERE name like ? ORDER BY ticker"
    // execute the sql query
    db.query(sqlquery, [search_text], (err, result) => {
        if (err) {            
            console.error("Database error:", err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "An error occurred while querying the database."
            });            
            next(err)
        }
        // where no records are found
        if (result.length === 0) {
            res.status(404).json({
                error: "Not Found",
                message: "No funds match the search_text in the database."
            });
        } else {
            // Successful response
            res.status(200).json(result);
        }
    })
});



// Export the router object so index.js can access it
module.exports = router