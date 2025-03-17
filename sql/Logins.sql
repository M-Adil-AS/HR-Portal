/* Creating Global Login: */
CREATE LOGIN [Global Login] WITH PASSWORD = 'globalLogin#123'; -- Create a SQL Server Login

/* Creating Owner Login: */
CREATE LOGIN [Owner Login] WITH PASSWORD = 'ownerLogin#123'; -- Create a SQL Server Login

USE [master];
GRANT CREATE ANY DATABASE TO [Owner Login]; -- Grant the Login Server Level Permissions, Permissions at the server scope can only be granted when the current database is master
GRANT CREATE LOGIN TO [Owner Login]; -- As Logins are stored in master db, this server-level permission can only be granted from master db
GRANT ALTER ANY LOGIN TO [Owner Login]; -- As Logins are stored in master db, this server-level permission can only be granted from master db