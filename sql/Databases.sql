/* Creating Global Database: */
CREATE DATABASE [Global Database]; -- Must be executed separately

USE [Global Database]; -- Switch to Global Database
CREATE USER [Global Database User] FOR LOGIN [Global Login]; -- Create a User inside the Global Database linked to GlobalLogin

CREATE ROLE [Global Database Manager]; -- Create a new Role inside Global Database
GRANT CONTROL ON DATABASE::[Global Database] TO [Global Database Manager]; -- Full Control to Global Database
DENY ALTER ON SCHEMA::dbo TO [Global Database Manager]; -- Except Dropping / Creating / Altering Tables

ALTER ROLE [Global Database Manager] ADD MEMBER [Global Database User]; -- Assign Role to User

CREATE TABLE Companies (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
    name VARCHAR(50) UNIQUE NOT NULL CHECK (LEN(name) BETWEEN 3 AND 50),
    domain VARCHAR(255) UNIQUE NOT NULL,
	createdAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Tenants (
    id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
	companyId VARCHAR(100) NOT NULL,
    dbName VARCHAR(255) UNIQUE NOT NULL,
    login NVARCHAR(255) UNIQUE NOT NULL,
    encryptedPassword TEXT NOT NULL,
    salt CHAR(32) NOT NULL,
    iv CHAR(32) NOT NULL
	FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

DROP TABLE Tenants;
DROP TABLE Companies;