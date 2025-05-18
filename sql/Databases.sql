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
	isDeleted BIT DEFAULT 0
	FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE NO ACTION
);

CREATE TABLE GlobalUsers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email VARCHAR(100) UNIQUE NOT NULL CHECK (LEN(email) BETWEEN 6 AND 100),
	-- phoneNumber VARCHAR(20) UNIQUE NOT NULL, -- Must include if app supports sms / whatsapp notifications
    tenantId UNIQUEIDENTIFIER NULL,
	userType VARCHAR(20) NOT NULL
    FOREIGN KEY (tenantId) REFERENCES Tenants(id) ON DELETE NO ACTION
	CONSTRAINT CHK_GlobalUsers_UserType_Valid CHECK (userType IN ('app_user', 'tenant_user')),
    CONSTRAINT CHK_GlobalUsers_UserType_TenantId CHECK (
        (userType = 'tenant_user' AND tenantId IS NOT NULL) OR
        (userType = 'app_user' AND tenantId IS NULL)
    )
);

CREATE TABLE AppUsers (
	id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
	globalUserId UNIQUEIDENTIFIER UNIQUE NOT NULL,
	name VARCHAR(50) NOT NULL CHECK (LEN(name) BETWEEN 3 AND 50),
    password VARCHAR(200) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
	isDeleted BIT DEFAULT 0,
	FOREIGN KEY (globalUserId) REFERENCES GlobalUsers(id) ON DELETE NO ACTION
);

CREATE TABLE Notifications (
	id INT IDENTITY(1,1) PRIMARY KEY,
	type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'web', 'sms', 'push', 'whatsapp')),
	link VARCHAR(255) NULL,
	action VARCHAR(50) NOT NULL,
	entityType VARCHAR(50) NOT NULL,
	senderId UNIQUEIDENTIFIER NOT NULL,
	createdAt DATETIME DEFAULT GETDATE(),
	data NVARCHAR(MAX) NOT NULL,
	isTenantActioned BIT DEFAULT 0, -- Indicating if tenant action has been performed on a multi-schedule notification in order to stop sending the next schedule notifications to any of the tenant users
	tenantActionedAt DATETIME DEFAULT NULL,
	FOREIGN KEY (senderId) REFERENCES GlobalUsers(id) ON DELETE NO ACTION
);

CREATE TABLE NotificationSchedule (
	id INT IDENTITY(1,1) PRIMARY KEY,
	notificationId INT NOT NULL,
	actionDateTime DATETIME NOT NULL
	FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE NO ACTION
);

CREATE TABLE NotificationUser (
	id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
	notificationId INT NOT NULL,
	recipientId UNIQUEIDENTIFIER NOT NULL,
	isUserActioned BIT DEFAULT 0, -- Indicating if user action has been performed on a multi-schedule notification in order to stop sending the next schedule notifications to the particular user
	userActionedAt DATETIME DEFAULT NULL,
	FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE NO ACTION,
	FOREIGN KEY (recipientId) REFERENCES GlobalUsers(id) ON DELETE NO ACTION
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
	FOREIGN KEY (notificationUserId) REFERENCES NotificationUser(id) ON DELETE NO ACTION,
	FOREIGN KEY (scheduleId) REFERENCES NotificationSchedule(id) ON DELETE NO ACTION
);