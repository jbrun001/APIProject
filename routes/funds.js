const express = require("express")
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt')
const router = express.Router()

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
    res.render("fundsSearch.ejs")
})

router.get('/search_result',redirectLogin, function (req, res, next) {
    // Search the database
    let sqlquery = "SELECT * FROM funds WHERE name LIKE '%" + req.sanitize(req.query.search_text) + "%'"
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        res.render("fundsList.ejs", {Funds:result})
     }) 
})


router.post(
    '/list',
    redirectLogin,
    [body('portfolio_id').isInt().withMessage('portfolio must be an integer')], 
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