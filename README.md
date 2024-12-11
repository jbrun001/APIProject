# project plan
```mermaid

gantt
    dateFormat  YYYY-MM-DD
    title       Databases & the Web Individual Project Plan
    excludes    sunday
    %% (`excludes` accepts specific dates in YYYY-MM-DD format, days of the week ("sunday") or "weekends", but not the word "weekdays".)

    section Research & Design
    Choose idea             :done,    rd1, 2024-11-04,2024-11-08
    Research APIs           :done,    rd2, 2024-11-09, 2d
    UI flow design          :done,    rd3, after rd2, 2d
    Database design & script  :done,    rd3d, after rd2, 2d
    security checklist      :done,  rd4, after rd3, 1d
    check rubric            :done,  rd5, after rd3, 1d
    test assumptions        :done, rd6, after rd5, 5d

    section Development
    Deploy base & set up git  :done,    d1, 2024-11-22,1d
    Deploy database          :done,    d2, after d1, 1d
    Code New interfaces       :done,    d3, after d2, 4d
    Project delay (Focus on FYP) :done,    delay1, after d3, 9d
    Code Application API      :active,    dd3a, after delay1, 6d
    Seurity changes and testing :  d4, after dd3a, 2d
    styling                   :    d6, after dd3a, 4d
    development contingency           :until doccomplete

    section Documentation
    start documentation :done,    d0, 2024-11-07,2024-11-08   
    draft documentation in mark down  :until finaldoc
    start final doc            :finaldoc, after d6, 4h
    final documentation :until doccomplete 
    Documentation complete              :milestone, doccomplete, 2025-01-06, 0d

    section Critical tasks
    Research & Design                   :crit, after d1, 4h
    Test deployment on server :crit,    dd3c, after dd3a, 4h
    Development complete                :crit, after d6, 4h
    Final Deployment on Goldsmith servers :crit, after d6, 2d
    Submit                              :milestone, 2025-01-08, 0d


```


## draft data structure

```mermaid
---
config:
  look: handDrawn
  theme: base
---
erDiagram
    portfolios {
        id INT PK 
        user_id INT FK
        name VARCHAR(100)
        value DECIMAL
        last_update DATETIME
    }
    transactions {
        id INT PK
        user_id INT FK
        fund_id INT FK
        portfolio_id INT FK
        volume DECIMAL
        date DATETIME
        share_price DECIMAL
        last_update DATETIME
    }
    funds {
        id INT PK
        holder VARCHAR(100)
        name VARCHAR(100)
        size DECIMAL
        fee DECIMAL
        distribution VARCHAR(20)
        holdings DECIMAL
        dividend_yield DECIMAL
        isin VARCHAR(15)
        ticker VARCHAR(10)
        last_updated DATETIME
    }
    users {
        id INT PK
        email VARCHAR(100)
        pwhash VARCHAR(200)
        type VARCHAR(10)
        last_login DATETIME
    }

    transactions }|--|| funds : "on fund_id"
    transactions }|--|| portfolios : "on portfolio_id"
    transactions }|--|| users : "on user_id"
    portfolios }|--|| users : "on user_id"

```

## draft UI flow v1.0

```mermaid
---
config:
  look: handDrawn
  theme: base
---
flowchart
    api["public api url"]
    i["index"]-->menu
    login["login"]
 
    menu["menu"]
    menu-->login

    portfoliolist["my portfolios"]
    portfolioadd["add"]
    portfoliodelete[["delete"]]
    menu-->portfoliolist
    portfoliolist-->portfolioadd
    portfolioadd-->portfoliolist
    portfoliolist-->portfoliodelete
    portfoliodelete-->portfoliolist
    portfoliolist-->fundslist
    about["help (about)"]
    fundslist["my funds"]
    fundview["view fund"]
    fundtransactions[["transactions"]]
    fundsummary[["summary"]]
    filterfunds[["find funds"]]
    transactionadd["add transaction"]
    fundslist-->filterfunds
    filterfunds-->transactionadd
    transactionadd-->fundslist
    fundslist-->fundview
    fundslist-->transactionadd
    fundview-->transactionadd
    fundview-->fundsummary
    fundview-->fundtransactions
    transactionadd-->fundview
    settings["settings"]
    menu-->settings
    menu-->about
    logout["logout"]
    menu-->logout
    adminuser["user admin"]
    adminfunds["fund admin"]
    settings-->adminuser
    settings-->adminfunds

    
```


# assumption testing
get some data and see if any of the APIs work

sample data from justetf
```
            isin     fee          size ticker   yahoo                                               Price   More data   Notes   alphaville
0   IE00B6YX5C33  0.0003  1.03   SPY5   https://finance.yahoo.com/quote/SPY5.L/             Yes     Yes         GBP
1   IE00B4K6B022  0.0005  8.96   H50E   https://finance.yahoo.com/quote/IE00B4K6B022.SG/    Yes     No          EUR
2   IE00B60SWX25  0.0005  5.57   SX5S   https://finance.yahoo.com/quote/SC0D.DE/            Yes     No          EUR
3   IE00B5B5TG76  0.0005  1.70   OSX5   https://finance.yahoo.com/quote/S6X0.DE/            Yes     Yes         EUR
4   IE00B60SX170  0.0005  4.72   MXUS   https://finance.yahoo.com/quote/MXUS.L/             Yes     Yes         ???
5   IE00BK5LYT47  0.0005  2.30   MXUD   https://finance.yahoo.com/quote/MXUD.L/             Yes     Yes
```


## yahoo finance, using a rapid api key


## alphaville using an API key that allows 25 queries a day


# Draft Documentation
## Outline [200 words max]
`An outline describing the application you have built (max 200 words)
`

My application is a stock portfolio reporting system.

## Links and Logins
`Links and logins: URL of your deployed, running app; Link to your Github repo; Username / password`

## Architecture [100 max] 
`A high-level architecture including a diagram and description (max 100 words) describing what technologies and components you have used in your application tier and data tier`

- Node.js, 
- express, 
- ejs, 
- bcrypt, 
- css - material from google?
- Hosting, 
- web server (apache?) 
- mysql

## Data Model [100]
`A data model including a diagram and description (max 100 words)`

- User
- Fund
- Transaction
- Portfolio

## User Functionality [500 words max]
`A description of the user-facing functionality of your application, adding screenshots to help explain (max 500 words)`

## Security [500 words max]
`A description of how you have addressed security risks in your application (max 500 words)`

Security checklist
- [ ] Transport SSL
- [X] Passwords bcrypt , passwords complexity
- [ ] API use (api key?), API rate limiting (denial of service?)
- [X] SQL Injection attacks – sanitisation
- [X] Cross Site Scripting – sanitisation
- [ ] Cross Site Request Forgery
- [ ] Content headers - CORS
- [ ] Rate limiting for pages as well
- [ ] zap test? if time

## API Usage
`Details of how to use your API`

## API Provision
## Advanced Techniques [500 words max]
`An optional description of any advanced techniques that you want us to consider as a demonstration of your development skills.  You must include code snippets to illustrate how you have used these techniques and refer to the files that contain that code. (max 500 words)`

