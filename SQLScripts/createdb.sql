# database creation scripts

CREATE TABLE fund (
    id INT PRIMARY KEY,
    holder NVARCHAR(MAX),
    name NVARCHAR(100),
    size DECIMAL(15, 2),
    fee DECIMAL(5, 4),
    distribution NVARCHAR(20),
    holdings DECIMAL(15, 2),
    dividend_yield DECIMAL(5, 4),
    isin NVARCHAR(15),
    ticker NVARCHAR(10),
    last_update DATETIME
);

CREATE TABLE transaction (
    id INT PRIMARY KEY,
    user_id INT,
    fund_id INT,
    portfolio_id INT,
    volume DECIMAL(5,3),
    transaction_date DATETIME,
    cost_per_share (5,3),
    last_update DATETIME
)

CREATE TABLE portfolio (
    id INT PRIMARY KEY,
    userid INT,
    fundid INT,
    name NVARCHAR(100),
    last_update DATETIME 
)

CREATE TABLE user (
    id INT PRIMARY KEY,
    email NVARCHAR(100),
    type NVARCHAR(10),
    pwhash NVARCHAR(200),
    last_login DATETIME 
)