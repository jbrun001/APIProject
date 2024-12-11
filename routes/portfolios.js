const express = require("express")
const router = express.Router()
const { validateAndSanitiseUsers } = require('../middleware/validateAndSanitiseInput');

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
    let sqlquery = "SELECT * FROM portfolios where user_id = ?"  
    // execute sql query
    db.query(sqlquery, [req.session.userId], (err, result) => {
        if (err) {
            next(err)
        }
        res.render("portfoliosList.ejs", {availablePortfolios:result})
     })
})


router.get('/add', redirectLogin, function (req, res, next) {
    if (req.session.userType == 'admin' || req.session.userType == 'customer')
    {
        res.render("portfoliosAdd.ejs")
    }else{
        res.send('You do not have permissions to add a portfolio. <a href='+'/'+'>Home</a>')
    }
})

router.post('/added', redirectLogin,function (req, res, next) {
    // saving this portfolio for this user in the database
    let sqlquery = "INSERT INTO portfolios (name, user_id) VALUES (?,?)"
    // execute sql query
    let newrecord = [req.sanitize(req.body.name), req.session.userId]
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            next(err)
        }
        else
            res.redirect("/portfolios/list")  // if successful list all the portfolios 
    })
}) 


router.get('/remove', redirectLogin, function (req, res, next) {
    if (req.session.userType == 'admin')
    {
        res.render("portfoliosRemove.ejs")
    }else{
        res.send('You do not have permissions to remove a portfolio. <a href='+'/'+'>Home</a>')
    }
})

router.post('/removed', redirectLogin,function (req, res, next) {
    // remove from the database
    // include user_id from session to stop editing of the html with
    // portfolios not for this user
    let sqlquery = "DELETE FROM portfolios WHERE portfolio_id = ? and user_id = ?"
    // execute sql query
    let newrecord = [req.session.userId, req.body.portfolio_id]
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            next(err)
        }
        else
            res.send(' This portfolio is removed from the database, name: '+ req.body.name)
    })
}) 

// Export the router object so index.js can access it
module.exports = router