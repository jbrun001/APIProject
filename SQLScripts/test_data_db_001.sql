insert into transactions (id, user_id, fund_id, portfolio_id, volume, transaction_date, share_price, last_update) 
				  values (1, 1, 49, 1,1000,'2024-11-24 11:50:14', 25,'2024-11-24 11:50:14');
insert into transactions (id, user_id, fund_id, portfolio_id, volume, transaction_date, share_price, last_update) 
				  values (2, 1, 49, 1,-100,'2024-11-24 11:50:14', 70,'2024-11-24 11:50:14');
insert into transactions (id, user_id, fund_id, portfolio_id, volume, transaction_date, share_price, last_update) 
				  values (3, 1, 49, 1,-1,'2024-11-24 11:50:14', 75,'2024-11-24 11:50:14');

insert into transactions (id, user_id, fund_id, portfolio_id, volume, transaction_date, share_price, last_update) 
				  values (4, 1, 50, 1,5000,'2024-11-24 11:50:14', 104,'2024-11-24 11:50:14');
insert into transactions (id, user_id, fund_id, portfolio_id, volume, transaction_date, share_price, last_update) 
				  values (5, 1, 50, 1,-100,'2024-11-24 11:50:14', 106.34,'2024-11-24 11:50:14');
insert into transactions (id, user_id, fund_id, portfolio_id, volume, transaction_date, share_price, last_update) 
				  values (6, 1, 50, 1,-1000,'2024-11-24 11:50:14', 103.23,'2024-11-24 11:50:14');

insert into transactions (id, user_id, fund_id, portfolio_id, volume, transaction_date, share_price, last_update) 
				  values (7, 1, 51, 1,750,'2024-11-24 11:50:14', 54,'2024-11-24 11:50:14');
insert into transactions (id, user_id, fund_id, portfolio_id, volume, transaction_date, share_price, last_update) 
				  values (8, 1, 51, 1,250,'2024-11-24 11:50:14', 60,'2024-11-24 11:50:14');

INSERT INTO funds (id, holder, name, size, fee, distribution, holdings, dividend_yield, isin, ticker, last_update) VALUES (49, '', 'Vanguard FTSE 250 UCITS ETF (GBP) Accumulating', 755000000.0, 0.001, 'Accumulating', 252.0, NULL, 'IE00BFMXVQ44', 'VMIG', '2024-11-15 11:50:14');
INSERT INTO funds (id, holder, name, size, fee, distribution, holdings, dividend_yield, isin, ticker, last_update) VALUES (50, '', 'Vanguard FTSE 250 UCITS ETF Distributing', 2035000000.0, 0.001, 'Distributing', 252.0, 0.036699999999999997, 'IE00BKX55Q28', 'VMID', '2024-11-15 11:50:14');
INSERT INTO funds (id, holder, name, size, fee, distribution, holdings, dividend_yield, isin, ticker, last_update) VALUES (51, '', 'Vanguard FTSE Developed Europe ex UK UCITS ETF (EUR) Accumulating', 459000000.0, 0.001, 'Accumulating', 431.0, NULL, 'IE00BK5BQY34', 'VERE', '2024-11-15 11:50:14');
INSERT INTO funds (id, holder, name, size, fee, distribution, holdings, dividend_yield, isin, ticker, last_update) VALUES (52, '', 'Vanguard FTSE Developed Europe ex UK UCITS ETF Distributing', 1729000000.0, 0.001, 'Distributing', 431.0, 0.0304, 'IE00BKX55S42', 'VERX', '2024-11-15 11:50:14');
INSERT INTO funds (id, holder, name, size, fee, distribution, holdings, dividend_yield, isin, ticker, last_update) VALUES (53, '', 'Vanguard FTSE Developed Europe UCITS ETF (EUR) Accumulating', 743000000.0, 0.001, 'Accumulating', 532.0, NULL, 'IE00BK5BQX27', 'VWCG', '2024-11-15 11:50:14');
INSERT INTO funds (id, holder, name, size, fee, distribution, holdings, dividend_yield, isin, ticker, last_update) VALUES (54, '', 'Vanguard FTSE Developed Europe UCITS ETF Distributing', 2430000000.0, 0.001, 'Distributing', 532.0, 0.0327, 'IE00B945VV12', 'VEUD', '2024-11-15 11:50:14');
INSERT INTO funds (id, holder, name, size, fee, distribution, holdings, dividend_yield, isin, ticker, last_update) VALUES (55, '', 'Vanguard FTSE North America UCITS ETF (USD) Accumulating', 1152000000.0, 0.001, 'Accumulating', 579.0, NULL, 'IE00BK5BQW10', 'VNRA', '2024-11-15 11:50:14');
INSERT INTO funds (id, holder, name, size, fee, distribution, holdings, dividend_yield, isin, ticker, last_update) VALUES (56, '', 'Vanguard FTSE North America UCITS ETF Distributing', 2023000000.0, 0.001, 'Distributing', 579.0, 0.0127, 'IE00BKX55R35', 'VDNR', '2024-11-15 11:50:14');
