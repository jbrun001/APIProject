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

// getFundsSearchResults
// gets searches funds based on the parameters passed and orders the result by the sort_by parameter
// this uses a promise, the calling code will wait for this to return a result before it continues
// this is necessary when we need to get results from multiple data queries (rather than nesting them)
// and this code could be re-used by other routes 
function getFundSearchResult(search_text, sort_by) {
    // console.log('getFundSearchResult: search_text: >' + search_text + '< sort_by: >' + sort_by +'<')
    return new Promise((resolve, reject) => {
        let sqlquery = "";
        search_text = '%' + search_text + '%'
        let order = ' ' + sort_by + ' DESC'                         // default is descending order
        if (sort_by === "fee") order = ' fee ASC'                  // except fees which are in ascending order
        sqlquery = "SELECT * FROM funds WHERE name LIKE '" + search_text + "' ORDER BY " + order
        // console.log('getFundSearchResult: sqlquery: >' + sqlquery + '<')
        // execute sql query
        db.query(sqlquery, (err, results) => {
            if (err) {
                console.error(err.message);
                reject(err); // if there is an error reject the Promise
            } else {
                resolve(results); // the Promise is resolved with the result of the query
            }
        });
    });
}
  

router.get('/search-result',validateAndSanitiseFunds,redirectLogin, function (req, res, next) {
    // Search the list of available funds
    let loggedInStatus = getLoggedInUser(req)
    console.log({ test: "search-result-promise", previousData: req.query, messages: req.validationErrors });
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
        Promise.all([
            getFundSearchResult(req.query.search_text, req.query.sort_by)       // Promise.all[0]
        ])
        .then(([getFundSearchResult]) => {     // if you had more data just add the name of it here first variable is the result of promise.all[0] etc.
            res.render("fundsSearchResults.ejs", {
                loggedInStatus,
                funds: getFundSearchResult,
                previousData: req.query,
                messages: [],  // if code here then it's successful and messages is empty
            });
        })
 //       .catch((error) => {
 //           console.log("Error getting data from database calls or in the code above");
 //       });
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