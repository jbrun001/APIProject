// Import express, ejs, express-session and mysql
var express = require ('express')
var session = require ('express-session')
var validator = require ('express-validator');
const expressSanitizer = require('express-sanitizer');
const {ORIGIN_URL} = require('./helpers/getOriginURL');
var ejs = require('ejs')
var mysql = require('mysql2')

// Import dotenv so we can store secrets out of view of github
// and we can have different settings for production and development
require("dotenv").config();  

// Create the express application object
const app = express()
const port = 8000

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs')

// Create an input sanitizer
app.use(expressSanitizer());

// Set up the body parser 
app.use(express.urlencoded({ extended: true }))

// Set up public folder (for css and statis js)
app.use(express.static(__dirname + '/public'))

// Security if we are in developement dont use https for the cookies
// but if we are live then use https for the cookies
let cookieSecure = false                                              // if this was true the production server would not work so had to set back to false
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
    saveUninitialized: false,                 // don't save sessions unless it's needed
    cookie: {
          secure: cookieSecure,               // force https when on live server but not in development
          httpOnly: true,                     // cookie can't be set by javascript
 //         domain: cookieDomain,               // restricts cookie sending to just this domain - had to remove this as was not working on uni server maybe because the domain and path are via apache?
 //         path: cookiePath,                   // restricts cookie sending to just the part of the path that has the routes - had to remove this as was not working on uni server maybe because the domain and path are via apache?
          expires: 600000                     // 10 mins before re-login is this too short?
    }
}))

console.log(`Domain: ${cookieDomain} Path: ${cookiePath}`)
// Security.  Disable this header to make it harder for attackers to know what technology is being used
app.disable('x-powered-by')   

// Define the database connection
// check to see if the .env has a variable LOCAL_DB=true  if this variable is present and set to true
// then we are in production mode and use localhost as the database with additional parameters from the .env
// else we are in development mode and use a cloud database 
let db;
if(process.env.LOCAL_DB && process.env.LOCAL_DB.toLowerCase() == "true") { 
  // local database - used for live system
  db = mysql.createConnection ({
    host: process.env.LOCAL_HOST,
    user: process.env.LOCAL_USER,
    password: process.env.LOCAL_PASSWORD,
    database: process.env.LOCAL_DATABASE
  });
  console.log("Using Local Database. Host: " +process.env.LOCAL_HOST + ",  Database: " + process.env.LOCAL_DATABASE);
} 
else {
  // cloud based development database  
  db = mysql.createConnection(process.env.DATABASE_URL);
  const url = new URL(process.env.DATABASE_URL);
  console.log("Using Cloud Database. Host: " + url.hostname + url.pathname);
}
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

// Load the route handlers
const mainRoutes = require("./routes/main")
app.use('/', mainRoutes)

// Load the route handlers for /users
const usersRoutes = require('./routes/users')
app.use('/users', usersRoutes)

// Load the route handlers for /portfolios
const portfoliosRoutes = require('./routes/portfolios')
app.use('/portfolios', portfoliosRoutes)

// Load the route handlers for /transactions
const transactionsRoutes = require('./routes/transactions')
app.use('/transactions', transactionsRoutes)

// Load the route handlers for /funds
const fundsRoutes = require('./routes/funds')
app.use('/funds', fundsRoutes)

// Load the route handlers for /prices
const pricesRoutes = require('./routes/prices')
app.use('/prices', pricesRoutes)

// Load the route handlers for /prices
const apiRoutes = require('./routes/api')
app.use('/api', apiRoutes)


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