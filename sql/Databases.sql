/* Creating Global Database: */
CREATE DATABASE [Global Database]; -- Must be executed separately

USE [Global Database]; -- Switch to Global Database
CREATE USER [Global Database User] FOR LOGIN [Global Login]; -- Create a User inside the Global Database linked to GlobalLogin

CREATE ROLE [Global Database Manager]; -- Create a new Role inside Global Database
GRANT CONTROL ON DATABASE::[Global Database] TO [Global Database Manager]; -- Full Control to Global Database
DENY ALTER ON SCHEMA::dbo TO [Global Database Manager]; -- Except Dropping / Creating / Altering Tables

ALTER ROLE [Global Database Manager] ADD MEMBER [Global Database User]; -- Assign Role to User

CREATE TABLE Companies (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name VARCHAR(50) UNIQUE NOT NULL CHECK (LEN(name) BETWEEN 3 AND 50),
    domain VARCHAR(98) UNIQUE NOT NULL CHECK (LEN(domain) BETWEEN 4 AND 98),
	createdAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Tenants (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
	companyId UNIQUEIDENTIFIER UNIQUE NOT NULL,
    dbName VARCHAR(53) UNIQUE NOT NULL,
    login VARCHAR(66) UNIQUE NOT NULL,
    encryptedPassword TEXT NOT NULL,
    salt CHAR(32) NOT NULL,
    iv CHAR(32) NOT NULL,
	FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE AppUsers (
	id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
	name VARCHAR(50) NOT NULL CHECK (LEN(name) BETWEEN 3 AND 50),
    email VARCHAR(100) UNIQUE NOT NULL CHECK (LEN(email) BETWEEN 6 AND 100),
    password VARCHAR(200) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE()
	-- phoneNumber VARCHAR(20) UNIQUE NOT NULL, -- Must include if app supports sms / whatsapp notifications
);

CREATE TABLE TenantUsers (
	id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
	email VARCHAR(100) UNIQUE NOT NULL,
	tenantId UNIQUEIDENTIFIER NOT NULL,
	FOREIGN KEY (tenantId) REFERENCES Tenants(id) ON DELETE CASCADE
	-- phoneNumber VARCHAR(20) UNIQUE NOT NULL, -- Must include if app supports sms / whatsapp notifications
);

/*
	createdBy instead of two separate nullable FK fields (to two tables: AppUsers, TenantUsers) in order to avoid query complexity and extra JOIN
	for simple applications having only one User Table (id, name, email), we can simply include a FK reference here using userId instead of createdBy
*/
CREATE TABLE Notifications (
	id INT IDENTITY(1,1) PRIMARY KEY,
	type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'web', 'sms', 'push', 'whatsapp')),
	link VARCHAR(255) NULL,
	action VARCHAR(50) NOT NULL,
	entityType VARCHAR(50) NOT NULL,
	createdBy VARCHAR(100) NOT NULL,
	createdByType VARCHAR(20) NOT NULL CHECK (createdByType IN ('app_user', 'tenant_user')),
	createdByTenantId UNIQUEIDENTIFIER NULL,
	createdAt DATETIME DEFAULT GETDATE(),
	data NVARCHAR(MAX) NOT NULL,
	isTenantActioned BIT DEFAULT 0, -- Indicating if tenant action has been performed on a multi-schedule notification in order to stop sending the next schedule notifications to any of the tenant users
	tenantActionedAt DATETIME DEFAULT NULL,
	FOREIGN KEY (createdByTenantId) REFERENCES Tenants(id) ON DELETE SET CASCADE
	CHECK (
		(createdByType = 'tenant_user' AND createdByTenantId IS NOT NULL) OR
		(createdByType = 'app_user' AND createdByTenantId IS NULL)
	)
);

CREATE TABLE NotificationSchedule (
	id INT IDENTITY(1,1) PRIMARY KEY,
	notificationId INT NOT NULL,
	actionDateTime DATETIME NOT NULL,
	FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE CASCADE,
);

/* 
	email, phoneNumber instead of two separate nullable FK fields (to two tables: AppUsers, TenantUsers) in order to avoid query complexity and extra JOIN
	for simple applications having only one User Table (id, name, email, phoneNumber), we can simply include a FK reference here using userId instead of email, phoneNumber
*/
CREATE TABLE NotificationUser (
	id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
	notificationId INT NOT NULL,
	email VARCHAR(100) NULL CHECK (LEN(email) BETWEEN 6 AND 100),
	recipientType VARCHAR(20) NOT NULL CHECK (recipientType IN ('app_user', 'tenant_user')),
	recipientTenantId UNIQUEIDENTIFIER NULL,
	isUserActioned BIT DEFAULT 0, -- Indicating if user action has been performed on a multi-schedule notification in order to stop sending the next schedule notifications to the particular user
	userActionedAt DATETIME DEFAULT NULL,
	FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE CASCADE,
	FOREIGN KEY (recipientTenantId) REFERENCES Tenants(id) ON DELETE SET CASCADE,
	CHECK (
	  (recipientType = 'tenant_user' AND recipientTenantId IS NOT NULL) OR
	  (recipientType = 'app_user' AND recipientTenantId IS NULL)
	)
	-- phoneNumber VARCHAR(20) NULL, -- Must include if app supports sms / whatsapp notifications
);

CREATE TABLE NotificationStatus (
	id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
	notificationUserId UNIQUEIDENTIFIER NOT NULL,
	scheduleId INT NOT NULL,
	isRead BIT DEFAULT 0,
	isProcessed BIT DEFAULT 0,
	isErrored BIT DEFAULT 0,
	processedAt DATETIME DEFAULT NULL,
	erroredAt DATETIME DEFAULT NULL,
	errorMsg NVARCHAR(MAX) DEFAULT NULL,
	FOREIGN KEY (notificationUserId) REFERENCES NotificationUser(id),
	FOREIGN KEY (scheduleId) REFERENCES NotificationSchedule(id)
);