// Import express, ejs, express-session and mysql
var express = require ('express')
var session = require ('express-session')
var validator = require ('express-validator');
const expressSanitizer = require('express-sanitizer');
const {ORIGIN_URL} = require('./helpers/getOriginURL');
var ejs = require('ejs')
var mysql = require('mysql2')
const csrf = require('csurf');                                // middleware for CSRF tokens

// Import dotenv so we can store secrets out of view of github
// and we can have different settings for production and development
require("dotenv").config();  

const app = express()                                         // Create the express application object
const port = 8000
app.set('view engine', 'ejs')                                 // Tell Express that we want to use EJS as the templating engine
app.use(expressSanitizer());                                  // Create an input sanitizer
app.use(express.urlencoded({ extended: true }))               // Set up the body parser 
app.use(express.static(__dirname + '/public'))                // Set up public folder (for css and static js)

// Security if we are in developement dont use https for the cookies
// but if we are live then use https for the cookies
// this failed testing on the uni server so I have reversed it
// if this was true the production server would not work so had to set back to false
// all routes that used session variables failed - I presume because it
// couldn't access the cookies over https.
let cookieSecure = false                                              
const url = new URL(ORIGIN_URL);
const cookieDomain = url.hostname;    // extracts the domain 
let cookiePath = url.pathname;        // extracts the path 
if (!cookiePath.endsWith('/')) {
    cookiePath += '/';
}
if (process.env.LIVE_SYSTEM.toLowerCase() == "false") {
    cookieSecure = false
}

// create a session
app.use(session({
    secret: process.env.SESSION_SECRET,       // use long session secret and keep in .env so not published on github
    name: process.env.SESSION_NAME,           // use a random session name so it's unpredictable for attackers, and put in .env
    resave: false,
    saveUninitialized: true,                  // the csrf for the /users views require an aunautheticateed session
    cookie: {
          secure: cookieSecure,               // force https when on live server but not in development
          httpOnly: true,                     // cookie can't be set by javascript
 //         domain: cookieDomain,             // restricts cookie sending to just this domain - had to remove this as was not working on uni server maybe because the domain and path are via apache?
 //         path: cookiePath,                 // restricts cookie sending to just the part of the path that has the routes - had to remove this as was not working on uni server maybe because the domain and path are via apache?
          expires: 600000                     // 10 mins before re-login is this too short?
    }
}))


console.log(`Domain: ${cookieDomain} Path: ${cookiePath}`)
// Security.  Disable this header to make it harder for attackers to know what technology is being used
app.disable('x-powered-by')   

// Define the database connection
// the .env file has these settings - so they are not stored in the source on github
let db;
db = mysql.createConnection ({
  host: process.env.LOCAL_HOST,
  user: process.env.LOCAL_USER,
  password: process.env.LOCAL_PASSWORD,
  database: process.env.LOCAL_DATABASE
});
console.log("Using Database. Host: " +process.env.LOCAL_HOST + ",  Database: " + process.env.LOCAL_DATABASE);
db.connect();

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err
    }
    console.log('Connected to database')
})
global.db = db

// Define our application-specific data
app.locals.appData = {appName: "Fund Tracker"}

// CSRF protection middleware
const csrfProtection = csrf({ cookie: false });                         // use a session-based token 

// Load the route handlers
const mainRoutes = require("./routes/main")
app.use('/', mainRoutes)                                                

// Load the route handlers for /users
const usersRoutes = require('./routes/users')
app.use('/users', csrfProtection, usersRoutes)

// Load the route handlers for /portfolios
const portfoliosRoutes = require('./routes/portfolios')
app.use('/portfolios', csrfProtection, portfoliosRoutes)

// Load the route handlers for /transactions
const transactionsRoutes = require('./routes/transactions')
app.use('/transactions', csrfProtection, transactionsRoutes)

// Load the route handlers for /funds
const fundsRoutes = require('./routes/funds')
app.use('/funds',csrfProtection, fundsRoutes)

// Load the route handlers for /prices
const pricesRoutes = require('./routes/prices')
app.use('/prices', pricesRoutes)

// Load the route handlers for /prices
const apiRoutes = require('./routes/api')
app.use('/api', apiRoutes)

// security. if the session has expired then the crsf token will have expired
// so catch this error if it happens - otherwise it will just look like
// an internal server error
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
      res.status(403).send('Session expired and with it the CRSF token.</br>Please <a href="/">click here</a> and try again.');
  } else {
      next(err); 
  }
});

// security. custom 404 so default will not give away we are using express
app.use((req, res, next) => {
  res.status(404).send("That resouce cannot be found")
})

// security. custom error so default will not give away we are using express
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('An error has occured')
})

// Start the web app listening
app.listen(port, () => console.log(`Node app listening on port ${port}!`))