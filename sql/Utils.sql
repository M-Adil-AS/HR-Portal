/* Get Server-Level Permissions applied to any Login */
SELECT sp.name AS principal_name, sp.type_desc, sp.is_disabled,  
       spr.permission_name, spr.state_desc  
FROM sys.server_permissions spr  
JOIN sys.server_principals sp ON spr.grantee_principal_id = sp.principal_id  
WHERE sp.name = 'Global Login'; 

/* Drop all Databases ending with _DB */
DECLARE @dbName NVARCHAR(255)
DECLARE db_cursor CURSOR FOR 
SELECT name 
FROM sys.databases 
WHERE name LIKE '%\_DB' ESCAPE '\'; -- Finds databases ending with _DB

OPEN db_cursor  
FETCH NEXT FROM db_cursor INTO @dbName  

WHILE @@FETCH_STATUS = 0  
BEGIN  
    DECLARE @sqlDropDB NVARCHAR(MAX) = 'DROP DATABASE [' + @dbName + '];'
    PRINT @sqlDropDB  -- Print the query to verify before execution
    EXEC sp_executesql @sqlDropDB  -- Execute the query
    FETCH NEXT FROM db_cursor INTO @dbName  
END  

CLOSE db_cursor  
DEALLOCATE db_cursor 

/* Drop all Logins ending with _DB_Login */
DECLARE @loginName NVARCHAR(255)
DECLARE login_cursor CURSOR FOR 
SELECT name 
FROM sys.server_principals 
WHERE type IN ('S', 'U') -- 'S' = SQL Login, 'U' = Windows Login
AND name LIKE '%\_DB_Login' ESCAPE '\'; -- Finds logins ending with _DB

OPEN login_cursor  
FETCH NEXT FROM login_cursor INTO @loginName  

WHILE @@FETCH_STATUS = 0  
BEGIN  
    DECLARE @sqlDropLogin NVARCHAR(MAX) = 'DROP LOGIN [' + @loginName + '];'
    PRINT @sqlDropLogin  -- Print the query to verify before execution
    EXEC sp_executesql @sqlDropLogin  -- Execute the query
    FETCH NEXT FROM login_cursor INTO @loginName  
END  

CLOSE login_cursor  
DEALLOCATE login_cursor  