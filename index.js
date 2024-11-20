// Import express, ejs, express-session and mysql
var express = require ('express')
var session = require ('express-session')
var ejs = require('ejs')
var mysql = require('mysql2')
require("dotenv").config();

// Create the express application object
const app = express()
const port = 8000

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs')

// Set up the body parser 
app.use(express.urlencoded({ extended: true }))

// Set up public folder (for css and statis js)
app.use(express.static(__dirname + '/public'))

// Create a session
app.use(session({
    secret: '92&*^hGue(98',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}))

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


// Start the web app listening
app.listen(port, () => console.log(`Node app listening on port ${port}!`))