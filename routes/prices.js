const express = require("express")
const { body, validationResult } = require('express-validator');
const router = express.Router()
const { getLoggedInUser } = require('../helpers/getLoggedInUser.js');
const request = require('request')

// get the start of the URL from index.js
const { ORIGIN_URL } = require('../index.js');
const redirectLogin = (req, res, next) => {
    if (!req.session.userId ) {       
        res.redirect(ORIGIN_URL+'/users/login') // redirect to the login page
    } else { 
        next (); // move to the next middleware function
    } 
}


// getLatestPriceData
// gets the most recent price record for a fund
// this is used in multiple routes 
// this uses a promise, the calling code will wait for this to return a result before it continues
function getLatestPriceData(fund_id) {  
    console.log('getLatestPriceData: fund_id: >' + fund_id + '<')
    return new Promise((resolve, reject) => {
        let sqlquery = "";
        sqlquery = "SELECT * FROM prices WHERE fund_id = ? ORDER BY price_date DESC LIMIT 1"
// console.log('getLatestPriceData: sqlquery: >' + sqlquery + '<')
        // execute sql query
        db.query(sqlquery,fund_id, (err, results) => {
            if (err) {
                console.error(err.message);
                reject(err); // if there is an error reject the Promise
            } else {
                resolve(results); // the Promise is resolved with the result of the query
            }
        });
    });
}

function setPriceData(sqlInserts) {
    return Promise.all(
        sqlInserts.map(({ query, params }) => {
            return new Promise((resolve, reject) => {
                db.query(query, params, (err, results) => {
                    if (err) {
                        console.error('Error executing query:', err.message);
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        })
    );
}

// formats a javascript date object to YYYY-MM-DD
function formatDate(date) {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {  // check if already string YYYY-MM-DD
        return date 
    }
    const year = date.getFullYear() 
    const month = String(date.getMonth() + 1).padStart(2, '0') 
    const day = String(date.getDate()).padStart(2, '0') 
    return `${year}-${month}-${day}` 
}

router.get('/update', redirectLogin, function (req, res, next) {
    // Measure start time
    const startTime = Date.now() 
    const loggedInStatus = getLoggedInUser(req) 
    const apiKey = process.env.API_KEY_ALPHAVANTAGE 
    const symbol = "VMIG.LON" 
    const fund_id = 50 
    const url = `http://localhost:8000/prices/test-external-api/?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`
    // const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`

    request(url, function (err, response, body) {                                    // get data from the API
        if (err) {
            console.error('Error fetching API:', err) 
            res.status(500).send('Error fetching data from API.') 
            return
        }
        const endTimeRequest = Date.now()                                           // measure after API response
        let sqlInserts = [] 
        const prices = JSON.parse(body) 
        
        if (prices["Time Series (Daily)"] !== undefined) {                          // validate the response - dies it have price data?
            const timeSeries = prices["Time Series (Daily)"]           
            Promise.all([getLatestPriceData(fund_id)])                              // get latest data for this fund
                .then(([getLatestPriceDataResult]) => {
                    let lastDate = ''                                               // '' gets all records if nothing in prices for this fund
                    let dbFormattedDate = ''                                          
                    if (getLatestPriceDataResult.length > 0) {
                        let dbDate = getLatestPriceDataResult[0].price_date
                        lastDate = formatDate(dbDate)        
                    }
console.log('getLatestPriceDataResult: ', getLatestPriceDataResult, ' lastDate: ', lastDate)
                    // loop through, create all the insert statements for data needed
                    for (const [price_date, values] of Object.entries(timeSeries)) {
                        const open = values["1. open"]
                        const high = values["2. high"]
                        const low = values["3. low"]
                        const close = values["4. close"]
                        const volume = values["5. volume"]
                        dbDate = price_date
                        dbFormattedDate = formatDate(dbDate)
                        if (dbFormattedDate > lastDate) {                       // only include data not already in prices
                            const sql = `
                                INSERT INTO prices (fund_id, ticker, price_date, open, high, low, close, volume)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE
                                    open = VALUES(open),
                                    high = VALUES(high),
                                    low = VALUES(low),
                                    close = VALUES(close),
                                    volume = VALUES(volume)
                            `
                            sqlInserts.push({
                                query: sql,
                                params: [fund_id, symbol, dbFormattedDate, open, high, low, close, volume],
                            })
                        }
                    }
                    return setPriceData(sqlInserts)
                })
                .then(() => {
                    const endTimeSQL = Date.now()                    // measure after SQL execution
console.log('Timing: Start to having API result:', endTimeRequest - startTime, 'ms, API data to finishing SQL:', endTimeSQL - endTimeRequest, 'ms Number of records that were inserted: ' + sqlInserts.length)
                    res.render('pricesUpdate.ejs', { sqlInserts, loggedInStatus })
                })
                .catch((error) => {
                    console.error('Error during SQL execution or data preparation:', error)
                    res.status(500).send('Database update failed.')
                })
        } else {
            console.error('Invalid API response:', prices)
            res.status(400).send('Invalid API response.')
        }
    });
})

// this is a test route which provides the same format of data as alphvantage
// because the alphavantage api is rate limited this allows testing
// without using up real access counts to the api
router.get('/test-external-api',function(req, res, next){
    res.send(`{
    "Meta Data": {
        "1. Information": "Daily Prices (open, high, low, close) and Volumes",
        "2. Symbol": "VMIG.LON",
        "3. Last Refreshed": "2024-11-27",
        "4. Output Size": "Compact",
        "5. Time Zone": "US/Eastern"
    },
    "Time Series (Daily)": {
        "2024-11-27": {
            "1. open": "36.8000",
            "2. high": "36.8600",
            "3. low": "36.6922",
            "4. close": "36.7725",
            "5. volume": "17315"
        },
        "2024-11-26": {
            "1. open": "36.7950",
            "2. high": "37.0950",
            "3. low": "36.7200",
            "4. close": "36.7725",
            "5. volume": "17418"
        },
        "2024-11-25": {
            "1. open": "37.0050",
            "2. high": "37.0775",
            "3. low": "36.7500",
            "4. close": "37.0775",
            "5. volume": "43795"
        },
        "2024-11-22": {
            "1. open": "36.3900",
            "2. high": "36.8050",
            "3. low": "36.2750",
            "4. close": "36.7650",
            "5. volume": "50118"
        },
        "2024-11-21": {
            "1. open": "36.3600",
            "2. high": "36.3600",
            "3. low": "35.9750",
            "4. close": "36.3000",
            "5. volume": "115801"
        },
        "2024-11-20": {
            "1. open": "36.5150",
            "2. high": "36.5900",
            "3. low": "36.0750",
            "4. close": "36.0850",
            "5. volume": "27546"
        },
        "2024-11-19": {
            "1. open": "36.2500",
            "2. high": "36.5300",
            "3. low": "36.1350",
            "4. close": "36.4150",
            "5. volume": "67202"
        },
        "2024-11-18": {
            "1. open": "36.5200",
            "2. high": "36.7200",
            "3. low": "36.2400",
            "4. close": "36.3600",
            "5. volume": "9554"
        },
        "2024-11-15": {
            "1. open": "36.5900",
            "2. high": "36.6800",
            "3. low": "36.3700",
            "4. close": "36.5150",
            "5. volume": "25934"
        },
        "2024-11-14": {
            "1. open": "36.4650",
            "2. high": "36.5775",
            "3. low": "36.2800",
            "4. close": "36.5775",
            "5. volume": "76918"
        },
        "2024-11-13": {
            "1. open": "36.6000",
            "2. high": "36.6050",
            "3. low": "36.1800",
            "4. close": "36.2775",
            "5. volume": "17463"
        },
        "2024-11-12": {
            "1. open": "36.6950",
            "2. high": "36.8350",
            "3. low": "36.4150",
            "4. close": "36.4325",
            "5. volume": "29484"
        },
        "2024-11-11": {
            "1. open": "36.6950",
            "2. high": "37.0750",
            "3. low": "36.6100",
            "4. close": "36.9250",
            "5. volume": "36789"
        },
        "2024-11-08": {
            "1. open": "36.8300",
            "2. high": "36.8300",
            "3. low": "36.4850",
            "4. close": "36.5650",
            "5. volume": "35219"
        },
        "2024-11-07": {
            "1. open": "36.6150",
            "2. high": "36.7800",
            "3. low": "36.4700",
            "4. close": "36.7800",
            "5. volume": "22912"
        },
        "2024-11-06": {
            "1. open": "36.7800",
            "2. high": "37.0750",
            "3. low": "36.3450",
            "4. close": "36.4250",
            "5. volume": "54759"
        },
        "2024-11-05": {
            "1. open": "36.3400",
            "2. high": "36.6200",
            "3. low": "36.3150",
            "4. close": "36.3150",
            "5. volume": "23960"
        },
        "2024-11-04": {
            "1. open": "36.5900",
            "2. high": "36.6750",
            "3. low": "36.4400",
            "4. close": "36.4600",
            "5. volume": "32421"
        },
        "2024-11-01": {
            "1. open": "36.3250",
            "2. high": "36.5800",
            "3. low": "36.3050",
            "4. close": "36.5200",
            "5. volume": "64089"
        },
        "2024-10-31": {
            "1. open": "36.9300",
            "2. high": "36.9300",
            "3. low": "36.2500",
            "4. close": "36.3550",
            "5. volume": "47283"
        },
        "2024-10-30": {
            "1. open": "36.7850",
            "2. high": "37.4600",
            "3. low": "36.6500",
            "4. close": "36.9250",
            "5. volume": "55580"
        },
        "2024-10-29": {
            "1. open": "37.2500",
            "2. high": "37.3100",
            "3. low": "36.7250",
            "4. close": "36.8000",
            "5. volume": "35968"
        },
        "2024-10-28": {
            "1. open": "37.1400",
            "2. high": "37.3500",
            "3. low": "37.0628",
            "4. close": "37.1850",
            "5. volume": "90564"
        },
        "2024-10-25": {
            "1. open": "37.0200",
            "2. high": "37.2300",
            "3. low": "36.9700",
            "4. close": "37.1975",
            "5. volume": "1169619"
        },
        "2024-10-24": {
            "1. open": "37.1700",
            "2. high": "37.3950",
            "3. low": "36.9750",
            "4. close": "37.0400",
            "5. volume": "12084"
        },
        "2024-10-23": {
            "1. open": "37.4000",
            "2. high": "37.4200",
            "3. low": "37.0973",
            "4. close": "37.1025",
            "5. volume": "39411"
        },
        "2024-10-22": {
            "1. open": "37.1950",
            "2. high": "37.3950",
            "3. low": "37.0750",
            "4. close": "37.3550",
            "5. volume": "10467"
        },
        "2024-10-21": {
            "1. open": "37.7350",
            "2. high": "37.7350",
            "3. low": "37.2450",
            "4. close": "37.4000",
            "5. volume": "131377"
        },
        "2024-10-18": {
            "1. open": "37.4850",
            "2. high": "37.7000",
            "3. low": "37.4200",
            "4. close": "37.6600",
            "5. volume": "31801"
        },
        "2024-10-17": {
            "1. open": "37.6350",
            "2. high": "37.6885",
            "3. low": "37.2950",
            "4. close": "37.5800",
            "5. volume": "25021"
        },
        "2024-10-16": {
            "1. open": "37.1650",
            "2. high": "37.4980",
            "3. low": "37.0350",
            "4. close": "37.3650",
            "5. volume": "59925"
        },
        "2024-10-15": {
            "1. open": "37.0550",
            "2. high": "37.2250",
            "3. low": "37.0100",
            "4. close": "37.0975",
            "5. volume": "34510"
        },
        "2024-10-14": {
            "1. open": "37.2200",
            "2. high": "37.2200",
            "3. low": "36.8911",
            "4. close": "37.0675",
            "5. volume": "24849"
        },
        "2024-10-11": {
            "1. open": "37.0200",
            "2. high": "37.0750",
            "3. low": "36.9000",
            "4. close": "37.0100",
            "5. volume": "49772"
        },
        "2024-10-10": {
            "1. open": "37.3950",
            "2. high": "37.4450",
            "3. low": "36.8900",
            "4. close": "36.9225",
            "5. volume": "32173"
        },
        "2024-10-09": {
            "1. open": "36.9750",
            "2. high": "37.2250",
            "3. low": "36.8250",
            "4. close": "37.2100",
            "5. volume": "34810"
        },
        "2024-10-08": {
            "1. open": "37.1100",
            "2. high": "37.1500",
            "3. low": "36.7418",
            "4. close": "36.8550",
            "5. volume": "23150"
        },
        "2024-10-07": {
            "1. open": "37.5100",
            "2. high": "37.5100",
            "3. low": "37.0800",
            "4. close": "37.1975",
            "5. volume": "86787"
        },
        "2024-10-04": {
            "1. open": "37.1150",
            "2. high": "37.4350",
            "3. low": "37.0000",
            "4. close": "37.3425",
            "5. volume": "22459"
        },
        "2024-10-03": {
            "1. open": "37.0500",
            "2. high": "37.2600",
            "3. low": "37.0150",
            "4. close": "37.0525",
            "5. volume": "45303"
        },
        "2024-10-02": {
            "1. open": "37.4400",
            "2. high": "37.5000",
            "3. low": "37.0350",
            "4. close": "37.1125",
            "5. volume": "18843"
        },
        "2024-10-01": {
            "1. open": "37.8400",
            "2. high": "37.8400",
            "3. low": "37.3500",
            "4. close": "37.3700",
            "5. volume": "13031"
        },
        "2024-09-30": {
            "1. open": "37.6700",
            "2. high": "37.9200",
            "3. low": "37.5000",
            "4. close": "37.5850",
            "5. volume": "39106"
        },
        "2024-09-27": {
            "1. open": "37.6650",
            "2. high": "37.8900",
            "3. low": "37.5050",
            "4. close": "37.8900",
            "5. volume": "24085"
        },
        "2024-09-26": {
            "1. open": "37.3650",
            "2. high": "37.6350",
            "3. low": "37.0750",
            "4. close": "37.4900",
            "5. volume": "23398"
        },
        "2024-09-25": {
            "1. open": "37.0950",
            "2. high": "37.2950",
            "3. low": "36.9928",
            "4. close": "37.0100",
            "5. volume": "19581"
        },
        "2024-09-24": {
            "1. open": "37.2050",
            "2. high": "37.4350",
            "3. low": "37.0670",
            "4. close": "37.0850",
            "5. volume": "23124"
        },
        "2024-09-23": {
            "1. open": "37.3950",
            "2. high": "37.3950",
            "3. low": "37.0554",
            "4. close": "37.1800",
            "5. volume": "23260"
        },
        "2024-09-20": {
            "1. open": "37.5350",
            "2. high": "37.6600",
            "3. low": "37.1550",
            "4. close": "37.1775",
            "5. volume": "21362"
        },
        "2024-09-19": {
            "1. open": "37.6000",
            "2. high": "37.7325",
            "3. low": "37.2000",
            "4. close": "37.7325",
            "5. volume": "20309"
        },
        "2024-09-18": {
            "1. open": "37.2550",
            "2. high": "37.3650",
            "3. low": "37.1225",
            "4. close": "37.1225",
            "5. volume": "8488"
        },
        "2024-09-17": {
            "1. open": "37.3900",
            "2. high": "37.5250",
            "3. low": "37.2800",
            "4. close": "37.3400",
            "5. volume": "30673"
        },
        "2024-09-16": {
            "1. open": "36.9250",
            "2. high": "37.2900",
            "3. low": "36.9250",
            "4. close": "37.2900",
            "5. volume": "34646"
        },
        "2024-09-13": {
            "1. open": "37.0500",
            "2. high": "37.3000",
            "3. low": "36.7350",
            "4. close": "37.2100",
            "5. volume": "41559"
        },
        "2024-09-12": {
            "1. open": "37.0050",
            "2. high": "37.1400",
            "3. low": "36.6300",
            "4. close": "36.8650",
            "5. volume": "32421"
        },
        "2024-09-11": {
            "1. open": "36.8000",
            "2. high": "36.8850",
            "3. low": "36.5100",
            "4. close": "36.5650",
            "5. volume": "46439"
        },
        "2024-09-10": {
            "1. open": "36.7600",
            "2. high": "36.8800",
            "3. low": "36.6250",
            "4. close": "36.7550",
            "5. volume": "21524"
        },
        "2024-09-09": {
            "1. open": "36.5550",
            "2. high": "36.7700",
            "3. low": "36.5550",
            "4. close": "36.7600",
            "5. volume": "17786"
        },
        "2024-09-06": {
            "1. open": "36.9900",
            "2. high": "37.0750",
            "3. low": "36.4801",
            "4. close": "36.4850",
            "5. volume": "30611"
        },
        "2024-09-05": {
            "1. open": "36.9700",
            "2. high": "37.2150",
            "3. low": "36.8400",
            "4. close": "36.9550",
            "5. volume": "106057"
        },
        "2024-09-04": {
            "1. open": "37.0450",
            "2. high": "37.0750",
            "3. low": "36.6750",
            "4. close": "37.0250",
            "5. volume": "21522"
        },
        "2024-09-03": {
            "1. open": "37.4950",
            "2. high": "37.5350",
            "3. low": "36.9900",
            "4. close": "37.0525",
            "5. volume": "21329"
        },
        "2024-09-02": {
            "1. open": "37.5350",
            "2. high": "37.7450",
            "3. low": "37.3250",
            "4. close": "37.3250",
            "5. volume": "43427"
        },
        "2024-08-30": {
            "1. open": "37.5550",
            "2. high": "37.7180",
            "3. low": "37.4050",
            "4. close": "37.5425",
            "5. volume": "72099"
        },
        "2024-08-29": {
            "1. open": "37.5450",
            "2. high": "37.7050",
            "3. low": "37.3750",
            "4. close": "37.4850",
            "5. volume": "18889"
        },
        "2024-08-28": {
            "1. open": "37.7750",
            "2. high": "37.7750",
            "3. low": "37.4400",
            "4. close": "37.4400",
            "5. volume": "26909"
        },
        "2024-08-27": {
            "1. open": "37.5750",
            "2. high": "37.9100",
            "3. low": "37.5750",
            "4. close": "37.6450",
            "5. volume": "53822"
        },
        "2024-08-23": {
            "1. open": "37.5200",
            "2. high": "37.7700",
            "3. low": "37.4900",
            "4. close": "37.6950",
            "5. volume": "18729"
        },
        "2024-08-22": {
            "1. open": "37.6200",
            "2. high": "37.8450",
            "3. low": "37.4450",
            "4. close": "37.4450",
            "5. volume": "60444"
        },
        "2024-08-21": {
            "1. open": "37.3300",
            "2. high": "37.5650",
            "3. low": "37.2500",
            "4. close": "37.5650",
            "5. volume": "97717"
        },
        "2024-08-20": {
            "1. open": "37.6200",
            "2. high": "37.7400",
            "3. low": "37.2650",
            "4. close": "37.2650",
            "5. volume": "28611"
        },
        "2024-08-19": {
            "1. open": "37.3750",
            "2. high": "37.6050",
            "3. low": "37.2750",
            "4. close": "37.5050",
            "5. volume": "16711"
        },
        "2024-08-16": {
            "1. open": "37.5350",
            "2. high": "37.5500",
            "3. low": "37.3150",
            "4. close": "37.3800",
            "5. volume": "32560"
        },
        "2024-08-15": {
            "1. open": "37.1400",
            "2. high": "37.5500",
            "3. low": "37.0200",
            "4. close": "37.4225",
            "5. volume": "64551"
        },
        "2024-08-14": {
            "1. open": "36.9550",
            "2. high": "37.1750",
            "3. low": "36.7850",
            "4. close": "37.1400",
            "5. volume": "18846"
        },
        "2024-08-13": {
            "1. open": "36.7700",
            "2. high": "36.8250",
            "3. low": "36.5500",
            "4. close": "36.7700",
            "5. volume": "12721"
        },
        "2024-08-12": {
            "1. open": "36.8450",
            "2. high": "36.8450",
            "3. low": "36.5350",
            "4. close": "36.6550",
            "5. volume": "14059"
        },
        "2024-08-09": {
            "1. open": "36.3400",
            "2. high": "36.7550",
            "3. low": "36.2700",
            "4. close": "36.5250",
            "5. volume": "36247"
        },
        "2024-08-08": {
            "1. open": "36.2150",
            "2. high": "36.3697",
            "3. low": "35.8850",
            "4. close": "36.3450",
            "5. volume": "40358"
        },
        "2024-08-07": {
            "1. open": "36.4850",
            "2. high": "36.5150",
            "3. low": "36.2200",
            "4. close": "36.5100",
            "5. volume": "126358"
        },
        "2024-08-06": {
            "1. open": "36.2800",
            "2. high": "36.4650",
            "3. low": "35.8500",
            "4. close": "36.1450",
            "5. volume": "83047"
        },
        "2024-08-05": {
            "1. open": "36.4350",
            "2. high": "36.5900",
            "3. low": "34.6200",
            "4. close": "35.8750",
            "5. volume": "122616"
        },
        "2024-08-02": {
            "1. open": "37.6450",
            "2. high": "37.9450",
            "3. low": "36.9250",
            "4. close": "36.9600",
            "5. volume": "52587"
        },
        "2024-08-01": {
            "1. open": "38.3600",
            "2. high": "38.6310",
            "3. low": "37.9343",
            "4. close": "38.0100",
            "5. volume": "36924"
        },
        "2024-07-31": {
            "1. open": "38.2600",
            "2. high": "38.4450",
            "3. low": "38.1350",
            "4. close": "38.3600",
            "5. volume": "29432"
        },
        "2024-07-30": {
            "1. open": "37.6400",
            "2. high": "38.2100",
            "3. low": "37.4650",
            "4. close": "38.0950",
            "5. volume": "84952"
        },
        "2024-07-29": {
            "1. open": "37.9000",
            "2. high": "38.1800",
            "3. low": "37.6940",
            "4. close": "37.7050",
            "5. volume": "30475"
        },
        "2024-07-26": {
            "1. open": "37.0900",
            "2. high": "37.8950",
            "3. low": "37.0300",
            "4. close": "37.8850",
            "5. volume": "34439"
        },
        "2024-07-25": {
            "1. open": "37.1900",
            "2. high": "37.2600",
            "3. low": "36.7340",
            "4. close": "37.0750",
            "5. volume": "64286"
        },
        "2024-07-24": {
            "1. open": "37.3000",
            "2. high": "37.4250",
            "3. low": "37.1600",
            "4. close": "37.1600",
            "5. volume": "69737"
        },
        "2024-07-23": {
            "1. open": "37.5100",
            "2. high": "37.6150",
            "3. low": "37.3150",
            "4. close": "37.4250",
            "5. volume": "18154"
        },
        "2024-07-22": {
            "1. open": "37.4750",
            "2. high": "37.6600",
            "3. low": "37.3800",
            "4. close": "37.4800",
            "5. volume": "31769"
        },
        "2024-07-19": {
            "1. open": "37.6500",
            "2. high": "37.6500",
            "3. low": "37.2900",
            "4. close": "37.3250",
            "5. volume": "60654"
        },
        "2024-07-18": {
            "1. open": "37.7300",
            "2. high": "37.8750",
            "3. low": "37.4350",
            "4. close": "37.6425",
            "5. volume": "140484"
        },
        "2024-07-17": {
            "1. open": "37.8150",
            "2. high": "37.8150",
            "3. low": "37.3600",
            "4. close": "37.3650",
            "5. volume": "47051"
        },
        "2024-07-16": {
            "1. open": "37.4050",
            "2. high": "37.6350",
            "3. low": "37.4050",
            "4. close": "37.6300",
            "5. volume": "36241"
        },
        "2024-07-15": {
            "1. open": "37.5450",
            "2. high": "37.6750",
            "3. low": "37.3650",
            "4. close": "37.5600",
            "5. volume": "27250"
        },
        "2024-07-12": {
            "1. open": "37.7300",
            "2. high": "37.7300",
            "3. low": "37.4500",
            "4. close": "37.6150",
            "5. volume": "35471"
        },
        "2024-07-11": {
            "1. open": "37.1250",
            "2. high": "37.5900",
            "3. low": "37.0600",
            "4. close": "37.5900",
            "5. volume": "82083"
        },
        "2024-07-10": {
            "1. open": "36.6150",
            "2. high": "37.1050",
            "3. low": "36.5600",
            "4. close": "37.1050",
            "5. volume": "28356"
        }
    }
}`)
})


// Export the router object so index.js can access it
module.exports = router