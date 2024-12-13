const express = require("express")
const router = express.Router()
const { validateAndSanitiseTransactions } = require('../middleware/validateAndSanitiseInput');
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

router.get('/list', validateAndSanitiseTransactions, redirectLogin,function(req, res, next) {
    let loggedInStatus = getLoggedInUser(req)
    let sqlquery = `SELECT funds.name as fund_name, portfolios.name as portfolio_name, transactions.id as id, 
                           volume, share_price, transaction_date
                    FROM transactions 
                    JOIN funds ON transactions.fund_id = funds.id
                    JOIN portfolios ON transactions.portfolio_id = portfolios.id 
                    WHERE transactions.user_id = ?
                    ORDER BY transactions.transaction_date DESC` 
    // execute sql query
    db.query(sqlquery, [req.session.userId],(err, result) => {
        if (err) {
            next(err)
        }
        res.render("transactionsList.ejs", {loggedInStatus, availableTransactions:result})
     })
})

router.post('/add', redirectLogin, function (req, res, next) {
    let loggedInStatus = getLoggedInUser(req)
    res.render('transactionsAdd.ejs', {
        loggedInStatus,
        fund_id:req.body.fund_id, 
        portfolio_id:req.body.portfolio_id,
        fund_name: req.body.fund_name,
        previousData: {}, // empty object for data previously entered
        messages: [],     // array for validation messages
    });
})

router.post('/added', validateAndSanitiseTransactions, redirectLogin, function (req, res, next) {
    // check if validation errors and if yes then re-display page with old data and error messages
    let loggedInStatus = getLoggedInUser(req)
    if (req.validationErrors) {
        // debug to test data is there
        console.log({ success: false, previousData: req.body, messages: req.validationErrors });
        // if there are errors then send the old data and the messages to the form
        // so they can be displayed
        return res.render('transactionsAdd.ejs', {
            loggedInStatus,
            fund_id: req.body.fund_id, 
            portfolio_id: req.body.portfolio_id,
            fund_name: req.body.fund_name,
            previousData: req.body,
            messages: req.validationErrors,
        });
    }
    else {
        // saving data in database
        let sqlquery = "INSERT INTO transactions (user_id, fund_id, portfolio_id, volume, share_price) VALUES (?,?,?,?,?)"
        // execute sql query
        let newrecord = [req.session.userId, req.body.fund_id, req.body.portfolio_id, req.body.volume, req.body.share_price]
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                next(err)
            }
            else
               // res.render("fundsList.ejs",{loggedInStatus, portfolio_id:req.body.portfolio_id})
                res.redirect("/portfolios/list")
        })
    } 
}) 

router.post('/remove',validateAndSanitiseTransactions, redirectLogin,function (req, res, next) {
    // saving data in database
    let sqlquery = "delete from transactions where id = ? and user_id = ?"
    // execute sql query
    let newrecord = [req.body.transaction_id, req.session.userId]
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            next(err)
        }
        else
            res.redirect("/transactions/list")
    })
}) 

// Export the router object so index.js can access it
module.exports = router