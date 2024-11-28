const express = require("express")
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
    let sqlquery = "SELECT * FROM funds WHERE name LIKE '%" + req.query.search_text + "%'" 
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        res.render("fundsList.ejs", {availableFunds:result})
     }) 
})


router.get('/list',redirectLogin, function(req, res, next) {
    let sqlquery = "SELECT * FROM funds where portfolio_id = 1" 
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        res.render("fundsList.ejs", {selectedFunds:result})
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
    // saving data in database
    let sqlquery = "INSERT INTO funds (name, price) VALUES (?,?)"
    // execute sql query
    let newrecord = [req.body.name, req.body.price]
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            next(err)
        }
        else
            res.send(' This fund was added to database, name: '+ req.body.name + ' price '+ req.body.price)
    })
}) 


// Export the router object so index.js can access it
module.exports = router