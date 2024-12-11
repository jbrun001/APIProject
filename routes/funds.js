const express = require("express")
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt')
const router = express.Router()
const { validateAndSanitiseFunds } = require('../middleware/validateAndSanitiseInput');

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
    if (req.validationErrors) {
        // debug to test data is there
        console.log({ success: false, previousData: req.query, messages: req.validationErrors });
        // if there are errors then send the old data and the messages to the form
        // so they can be displayed
        return res.render('fundsSearchResults.ejs', {
            previousData: req.query,
            messages: req.validationErrors,
            funds: [],   // if there are errors don't display any funds
        });
    }
    else {
        // if there is a sorting parameter then order by that
        let order = ' ORDER BY NAME ASC'
        if (req.query.sort_by) {
            order = ' ORDER BY ' + req.query.sort_by + ' ASC'
        }
        let sqlquery = "SELECT * FROM funds WHERE name LIKE ?" + order
        const searchText = '%' + req.query.search_text + '%';
        // execute sql query
        console.log(sqlquery)
        db.query(sqlquery,[searchText], (err, result) => {
            if (err) {
                next(err)
            }
            res.render("fundsSearchResults.ejs", 
                {
                    funds:result,
                    previousData: req.query,
                    messages: [],  // if code here then it's successful and messages is empty
                }
            )
        })
    } 
})


router.post(
    '/list',
    validateAndSanitiseFunds,redirectLogin,
    function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // group transactions to get list of funds in this portfolio
    let sqlquery = `SELECT transactions.fund_id, funds.ticker, funds.name, 
                    	SUM(transactions.volume * transactions.share_price) AS total_cost, 
                        SUM(transactions.volume) AS total_shares,
                        MAX(transactions.transaction_date) AS last_transaction
                    FROM transactions JOIN funds ON transactions.fund_id = funds.id 
                    WHERE transactions.user_id = ? AND transactions.portfolio_id = ?
                    GROUP BY transactions.fund_id, funds.name 
                    ORDER BY funds.name;` 
    // execute sql query
    db.query(sqlquery,[req.sanitize(req.body.portfolio_id), req.session.userId, req.sanitize(req.body.portfolio_id)], (err, result) => {
        if (err) {
            next(err)
        }
        res.render("fundsList.ejs", {portfolio_id:req.sanitize(req.body.portfolio_id), funds:result})
     })
})


router.get('/add', redirectLogin, function (req, res, next) {
    if (req.session.userType == 'admin')
    {
        res.render("fundsAdd.ejs")
    }else if(req.session.userType == 'user'){
        res.send('You do not have permissions to add a new fund. <a href='+'/'+'>Home</a>')
    }else{
        res.send('You do not have permissions to add a new fund. <a href='+'/'+'>Home</a>')
    }
})

router.post('/added',redirectLogin, function (req, res, next) {
    fundName = req.sanitize(req.body.name)
    fundPrice = req.sanitize(req.body.price)
    // saving data in database
    let sqlquery = "INSERT INTO funds (name, price) VALUES (?,?)"
    // execute sql query
    let newrecord = [fundName, fundPrice]
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