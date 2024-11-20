// Create a new router
const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const saltRounds = 10
const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {
        res.redirect('/users/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}

router.get('/register', function (req, res, next) {
    res.render('register.ejs')                                                               
})    

router.post('/registered', function (req, res, next) {
    // extracts the password & email field from the data 
    const type = "customer"
    const plainPassword = req.body.password
    const email = req.body.email
    // hash the pssword
    bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
        // store hashed password in your database.
        let sqlquery = "INSERT INTO users (type, pwhash, email) VALUES (?,?,?)"
        let newrecord = [type, hashedPassword, email]
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                next(err)
            }
            else
                res.send(' User '+req.body.email +' has been added to database. <a href='+'/'+'>Home</a>')
        })
    })                                                                       
})

router.get('/list',redirectLogin, function(req, res, next) {
    let sqlquery = "SELECT * FROM users" // query database to get all the users
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        res.render("userList.ejs", {userList:result})
    })
})

router.get('/login', function(req, res, next) {
    const userInstruction = " "
    res.render('login.ejs', {userInstruction})  
})

router.post('/loggedin', function(req, res, next) {
    // extracts the password & email field from the data 
    const plainPassword = req.body.password
    const email = req.body.email

    // set the instructions for when theres an incorect login details
    const userInstruction = "Login details are incorrect, please try again"

    // gets the user infomation from the database
    let sqlquery = "SELECT * FROM users WHERE email= ? "

    // execute sql query
    db.query(sqlquery, email,(err, dbresult) => {
        if (err) {  
            // if sql command is incorect/databse isnt connected
            console.error("logged in: sql to get password failed")
            next(err)
        }
        // check if no results from the sql - this means this user doesn't exist
        else if (dbresult == null || dbresult.length === 0) {
            console.error("logged in: user not found in database")
            res.render('login.ejs', {userInstruction})  
        }
        else { 
            req.session.userType = dbresult[0].type;
            // dbresult[0].pwhash gets the first row in the dbresult (incase there are 2 users with the same email)
            bcrypt.compare(plainPassword, dbresult[0].pwhash, function(err, result) { 
                if (err) {
                    console.error("logged in: compare of passwords failed")
                    next(err)
                }
                else if (result == true) {
                    // Save user session here, when login is successful
                    req.session.userEmail = dbresult[0].email;
                    req.session.userId = dbresult[0].id;
                    req.session.userType = dbresult[0].type;
                    res.send(' Username and password matches!! <a href='+'/'+'>Home</a>')
                }
                else {
                    res.render('login.ejs', {userInstruction})  
                }
            })
        }
    })
})
router.get('/logout', redirectLogin, (req,res) => {
    req.session.destroy(err => {
    if (err) {
      return res.redirect('./')
    }
    res.send('you are now logged out. <a href='+'/'+'>Home</a>');
    })
})

// Export the router object so index.js can access it
module.exports = router