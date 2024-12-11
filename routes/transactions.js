const express = require("express")
const router = express.Router()
const { validateAndSanitiseTransactions } = require('../middleware/validateAndSanitiseInput');

// get the start of the URL from index.js
const { ORIGIN_URL } = require('../index.js');
const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {       
        res.redirect(ORIGIN_URL+'/users/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}

router.get('/list', redirectLogin,function(req, res, next) {
    let sqlquery = "SELECT * FROM transactions where user_id = ?" 
    // execute sql query
    db.query(sqlquery, [req.session.userId],(err, result) => {
        if (err) {
            next(err)
        }
        res.render("transactionsList.ejs", {availableTransactions:result})
     })
})


router.post('/add', redirectLogin, function (req, res, next) {
    res.render('transactionsAdd.ejs', {
        fund_id:req.body.fund_id, 
        portfolio_id:req.body.portfolio_id,
        fund_name: req.body.fund_name,
        previousData: {}, // empty object for data previously entered
        messages: [],     // array for validation messages
    });
})

router.post('/added', validateAndSanitiseTransactions, redirectLogin, function (req, res, next) {
    // check if validation errors and if yes then re-display page with old data and error messages
    if (req.validationErrors) {
        // debug to test data is there
        console.log({ success: false, previousData: req.body, messages: req.validationErrors });
        // if there are errors then send the old data and the messages to the form
        // so they can be displayed
        return res.render('transactionsAdd.ejs', {
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
                res.render("fundsList.ejs",{portfolio_id:req.body.portfolio_id})
        })
    } 
}) 



router.get('/remove', redirectLogin, function (req, res, next) {
    if (req.session.userType == 'admin')
    {
        res.render("transactionsRemove.ejs")
    }else{
        res.send('You do not have permissions to remove a transaction. <a href='+'/'+'>Home</a>')
    }
})

router.post('/removed', redirectLogin,function (req, res, next) {
    // saving data in database
    let sqlquery = "INSERT INTO transactions (name, price) VALUES (?,?)"
    // execute sql query
    let newrecord = [req.body.name, req.body.price]
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            next(err)
        }
        else
            res.send(' This transaction is removed from the database, name: '+ req.body.name)
    })
}) 

// Export the router object so index.js can access it
module.exports = router