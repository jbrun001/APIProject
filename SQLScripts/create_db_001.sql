# initial database creation scripts
# version 1.0   initial scripts and application user   
# Create database script for the portolio app
# Create the database
CREATE DATABASE IF NOT EXISTS portfolio;
USE portfolio;

# remove any table that exist already
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS funds;
DROP TABLE IF EXISTS portfolios;
DROP TABLE IF EXISTS transactions;

CREATE TABLE funds (
    id INT,
    holder VARCHAR(100),
    name VARCHAR(100),
    size DECIMAL(15, 2),
    fee DECIMAL(10, 5),
    distribution VARCHAR(20),
    holdings DECIMAL(15, 2),
    dividend_yield DECIMAL(10, 5),
    isin VARCHAR(15),
    ticker VARCHAR(10),
    last_update DATETIME,
    PRIMARY KEY(id)
);

ALTER TABLE funds MODIFY id INT AUTO_INCREMENT;

CREATE TABLE transactions (
    id INT,
    user_id INT,
    fund_id INT,
    portfolio_id INT,
    volume DECIMAL(15,2),
    transaction_date DATETIME,
    cost_per_share DECIMAL(10,5),
    last_update DATETIME,
    PRIMARY KEY(id)
);

ALTER TABLE transactions MODIFY id INT AUTO_INCREMENT;


CREATE TABLE portfolios (
    id INT,
    user_id INT,
    fund_id INT,
    name VARCHAR(100),
    value DECIMAL(15,2),
    last_update DATETIME, 
    PRIMARY KEY(id)
);

ALTER TABLE portfolios MODIFY id INT AUTO_INCREMENT;

CREATE TABLE users (
    id INT,
    email VARCHAR(100),
    type VARCHAR(10),
    pwhash VARCHAR(200),
    last_login DATETIME,
    PRIMARY KEY(id) 
);

ALTER TABLE users MODIFY id INT AUTO_INCREMENT;


USE portfolio;
DROP USER IF EXISTS 'portfolio_app'@'localhost';
CREATE USER 'portfolio_app'@'localhost' IDENTIFIED WITH mysql_native_password BY '^&6dwjk2J621';
GRANT ALL PRIVILEGES ON portfolio.* TO 'portfolio_app'@'localhost';