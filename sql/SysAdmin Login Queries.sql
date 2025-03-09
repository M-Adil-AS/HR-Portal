/* Creating Global Database: */
CREATE DATABASE [Global Database];

/* Creating Global Login: */
CREATE LOGIN [Global Login] WITH PASSWORD = 'globalLogin#123'; -- Create a SQL Server Login

-- GRANT CREATE ANY DATABASE TO [Global Login]; -- Grant the Login Server Level Permissions

-- USE [master];
-- GRANT CREATE LOGIN TO [Global Login]; -- As Logins are stored in master db, this server-level permission can only be granted from master db

USE [Global Database]; -- Switch to Global Database
CREATE USER [Global Database User] FOR LOGIN [Global Login]; -- Create a User inside the Global Database linked to GlobalLogin

CREATE ROLE [Global Database Manager]; -- Create a new Role inside Global Database
GRANT CONTROL ON DATABASE::[Global Database] TO [Global Database Manager]; -- Full Control to Global Database
DENY ALTER ON SCHEMA::dbo TO [Global Database Manager]; -- Except Dropping and Altering Tables

ALTER ROLE [Global Database Manager] ADD MEMBER [Global Database User]; -- Assign Role to User

/* Get Server-Level Permissions applied to Global Login */
SELECT sp.name AS principal_name, sp.type_desc, sp.is_disabled,  
       spr.permission_name, spr.state_desc  
FROM sys.server_permissions spr  
JOIN sys.server_principals sp ON spr.grantee_principal_id = sp.principal_id  
WHERE sp.name = 'Global Login';