// Create a new router
const express = require("express")
const router = express.Router()
const { validateAndSanitiseUsers } = require('../helpers/validateAndSanitiseInput');
const { getLoggedInUser } = require('../helpers/getLoggedInUser');
const { ORIGIN_URL } = require('../helpers/getOriginURL')
const { redirectLogin} = require('../helpers/redirectLogin')
const bcrypt = require('bcrypt')
const saltRounds = 10

// Security. Import express-rate-limit so we can stop brute forcing
// of the login
const rateLimit = require('express-rate-limit');
const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,            // 1 minute before retry
    max: 5,                             // limit each IP to 5 login attempts per minute
    message: "{error:'Rate Limited', message: 'Too many login attempts, please try again after 1 minute.'}"
});

router.get('/register', function (req, res, next) {
    let loggedInStatus = getLoggedInUser(req)
    // the register route  is called from a url - when 
    // the user is entering data for the first time
    // register.ejs is also rendered when there was a 
    // validation error with the input fields so 
    // when we render this we need to include empty data
    // for these fields - so the .ejs still knows about
    // them
    res.render('register.ejs', {
        loggedInStatus,
        previousData: {},                               // empty object for data previously entered
        messages: [],                                   // array for validation messages
        crsfToken: req.csrfToken()                      // csrf token
    });
})    

router.post('/registered', validateAndSanitiseUsers, function (req, res, next) {
    let loggedInStatus = getLoggedInUser(req)
    // check if validation errors and if yes then re-display page with old data and error messages
    if (req.validationErrors) {
        // debug to test data is there
        // res.json({ success: false, previousData: req.body, messages: req.validationErrors });
        // if there are errors then send the old data and the messages to the form
        // so they can be displayed
        return res.render('register.ejs', {
            loggedInStatus,
            previousData: req.body,
            messages: req.validationErrors,
            crsfToken: req.csrfToken()                      // csrf token
        });
    }
    else {
        const type = "customer"
        // hash the pssword
        bcrypt.hash(req.body.password, saltRounds, function(err, hashedPassword) {
            // store hashed password in your database.
            let sqlquery = "INSERT INTO users (type, pwhash, email) VALUES (?,?,?)"
            let newrecord = [type, hashedPassword, req.body.email]
            db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                    next(err)
                }
                else res.redirect(ORIGIN_URL+"/")
            })
        })   
    }                                                                    
})

router.get('/list',redirectLogin, function(req, res, next) {
    let sqlquery = "SELECT * FROM users" // query database to get all the users
    // execute sql query
    db.query(sqlquery, (err, result) => {
        if (err) {
            next(err)
        }
        let loggedInStatus = getLoggedInUser(req)
        res.render("userList.ejs", {userList:result,loggedInStatus})
    })
})

router.get('/login', function(req, res, next) {
    const userInstruction = " "
    let loggedInStatus = getLoggedInUser(req)
    res.render('login.ejs', {userInstruction, loggedInStatus, crsfToken: req.csrfToken()}) 
})

router.post('/loggedin', loginRateLimiter, function(req, res, next) {
    // extracts the password & email field from the data 
    const plainPassword = req.sanitize(req.body.password)
    const email = req.sanitize(req.body.email)

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
            let loggedInStatus = getLoggedInUser(req)
            res.render('login.ejs', {userInstruction, loggedInStatus})   
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
                    let loggedInStatus = getLoggedInUser(req)
                    res.render('index.ejs', {loggedInStatus})  
                    console.log("logged in: user: " + req.session.userEmail)
                }
                else {
                    let loggedInStatus = getLoggedInUser(req)
                    res.render('login.ejs', {userInstruction, loggedInStatus, crsfToken: req.csrfToken()})  
                }
            })
        }
    })
})
router.get('/logout', redirectLogin, (req,res) => {
    req.session.destroy(err => {
        if (err) {
        return res.redirect('index.ejs')
        }
        res.redirect(ORIGIN_URL+"/") // redirect to the home page with the links on it
    })
})

// Export the router object so index.js can access it
module.exports = router