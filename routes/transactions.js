const express = require("express")
const router = express.Router()
const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
        res.redirect('/users/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}


router.get('/list', redirectLogin,function(req, res, next) {
    let sqlquery = "SELECT * FROM transactions where user_id = 1" 
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        res.render("transactionsList.ejs", {availableTransactions:result})
     })
})


router.get('/add', redirectLogin, function (req, res, next) {
    if (req.session.userType == 'admin')
    {
        res.render("transactionsAdd.ejs")
    }else{
        res.send('You do not have permissions to add a transaction. <a href='+'/'+'>Home</a>')
    }
})

router.post('/added', redirectLogin,function (req, res, next) {
    // saving data in database
    let sqlquery = "INSERT INTO transactions (name, price) VALUES (?,?)"
    // execute sql query
    let newrecord = [req.body.name, req.body.price]
    db.query(sqlquery, newrecord, (err, result) => {
        if (err) {
            next(err)
        }
        else
            res.send(' This transaction is added to database, name: '+ req.body.name)
    })
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