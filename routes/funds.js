const express = require("express")
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt')
const router = express.Router()
const { validateAndSanitiseFunds } = require('../middleware/validateAndSanitiseInput');
const { getLoggedInUser } = require('../helpers/getLoggedInUser');

// get the start of the URL from index.js
const { ORIGIN_URL } = require('../index.js');
const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {       
        res.redirect(ORIGIN_URL+'/users/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}

router.get('/search',redirectLogin,function(req, res, next){
    res.render("fundsSearch.ejs",{
        previousData: {}, // empty object for data previously entered
        messages: [],     // array for validation messages
    });
})

router.get('/search-result',validateAndSanitiseFunds,redirectLogin, function (req, res, next) {
    // Search the list of available funds
    let loggedInStatus = getLoggedInUser(req)
    if (req.validationErrors) {
        // debug to test data is there
//        console.log({ success: false, previousData: req.query, messages: req.validationErrors });
        // if there are errors then send the old data and the messages to the form
        // so they can be displayed
        return res.render('fundsSearchResults.ejs', {
            loggedInStatus,
            previousData: req.query,
            messages: req.validationErrors,
            funds: [],   // if there are errors don't display any funds
        });
    }
    else {
        // debug to test data is there       
//        console.log({ success: true, previousData: req.query, messages: req.validationErrors });
        // if there is a sorting parameter then order by that
        let order = ' ORDER BY NAME ASC'
        if (req.query.sort_by) {
            order = ' ORDER BY ' + req.query.sort_by + ' ASC'
        }
        let sqlquery = "SELECT * FROM funds WHERE name LIKE ?" + order
        const searchText = '%' + req.query.search_text + '%';
        // execute sql query
//        console.log(sqlquery)
        db.query(sqlquery,[searchText], (err, result) => {
            if (err) {
                next(err)
            }
            res.render("fundsSearchResults.ejs", 
                {
                    loggedInStatus,
                    funds:result,
                    previousData: req.query,
                    messages: [],  // if code here then it's successful and messages is empty
                }
            )
        })
    } 
})


router.post('/list',validateAndSanitiseFunds, redirectLogin, function(req, res, next) {
    let loggedInStatus = getLoggedInUser(req)
    // group transactions to get list of funds in this portfolio
    let sqlquery = `SELECT transactions.fund_id as fund_id, funds.ticker, funds.name, 
                    	SUM(transactions.volume * transactions.share_price) AS total_cost, 
                        SUM(transactions.volume) AS total_shares,
                        MAX(transactions.transaction_date) AS last_transaction
                    FROM transactions JOIN funds ON transactions.fund_id = funds.id 
                    WHERE transactions.user_id = ? AND transactions.portfolio_id = ?
                    GROUP BY transactions.fund_id, funds.name 
                    ORDER BY funds.name` 
    // execute sql query
    db.query(sqlquery,[req.body.portfolio_id, req.session.userId, req.body.portfolio_id], (err, result) => {
        if (err) {
            next(err)
        }
        res.render("fundsList.ejs", {loggedInStatus, portfolio_id:req.body.portfolio_id, funds:result})
     })
})


router.get('/add',validateAndSanitiseFunds, redirectLogin, function (req, res, next) {
    let loggedInStatus = getLoggedInUser(req)
    if (req.session.userType == 'admin') {
        res.render("fundsAdd.ejs",loggedInStatus)
    } else res.redirect("/")
})

router.post('/added',validateAndSanitiseFunds, function (req, res, next) {
    // saving data in database
    let sqlquery = "INSERT INTO funds (name, price) VALUES (?,?)"
    // execute sql query
    let newrecord = [req.body.name, req.body.price]
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            next(err)
        }
        else
            res.send(' This fund was added to database, name: '+ fundName + ' price '+ fundPrice)
    })
}) 


// Export the router object so index.js can access it
module.exports = router