USE [Global Database]
GO
/****** Object:  StoredProcedure [dbo].[SaveNotification]    Script Date: 02/05/2025 12:32:09 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
ALTER PROCEDURE [dbo].[SaveNotification]
(
    @type VARCHAR(20),
    @entityType VARCHAR(50),
    @action VARCHAR(50),
    @createdBy VARCHAR(100),
    @link VARCHAR(255),
    @sendTo VARCHAR(MAX),
    @data NVARCHAR(MAX),
    @schedule NVARCHAR(MAX) = NULL
)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets from interfering with SELECT statements.
    SET NOCOUNT ON

    DECLARE @notificationId INT;
    DECLARE @now DATETIME = GETDATE();
	DECLARE @senderId UNIQUEIDENTIFIER;

	-- Resolve senderId based on @type
    SELECT @senderId = id
    FROM GlobalUsers
    WHERE email = @createdBy;

    IF @senderId IS NULL
    BEGIN
        RAISERROR('Sender not found in GlobalUsers', 16, 1);
        RETURN;
    END

	-- Insert Notification
	INSERT INTO Notifications (
        [type], [link], [action], [entityType], [senderId], [createdAt], [data]
    )
    VALUES (
        @type, @link, @action, @entityType, @senderId, @now, @data
    );

    SET @notificationId = SCOPE_IDENTITY();

	-- Insert Schedule(s)
	IF @schedule IS NULL
    BEGIN
        SELECT @schedule = CONVERT(NVARCHAR, @now);
    END

    DECLARE @Schedules TABLE (
		id INT,
		actionDateTime DATETIME
	);

	INSERT INTO NotificationSchedule (notificationId, actionDateTime)
	OUTPUT inserted.id, inserted.actionDateTime
	INTO @Schedules(id, actionDateTime)
	SELECT @notificationId, dt.actionDateTime
	FROM (
		SELECT TRY_CAST(value AS DATETIME) AS actionDateTime
		FROM string_split(@schedule, ',')
	) dt
	WHERE dt.actionDateTime IS NOT NULL;

	-- Resolve recipient IDs based on @type
    DECLARE @Recipients TABLE (
        value VARCHAR(100),
        recipientId UNIQUEIDENTIFIER
    );

    INSERT INTO @Recipients (value, recipientId)
    SELECT 
        inputVal = TRIM(ss.value),
        gu.id
    FROM string_split(@sendTo, ',') ss
    JOIN GlobalUsers gu ON (
        (@type IN ('email', 'web') AND gu.email = TRIM(ss.value))
        -- OR (@type IN ('sms', 'whatsapp') AND gu.phoneNumber = TRIM(ss.value))
    );

	-- Validation for missing recipients
    DECLARE @expected INT = (SELECT COUNT(*) FROM string_split(@sendTo, ','));
    DECLARE @actual INT = (SELECT COUNT(*) FROM @Recipients);

    IF @actual < @expected
    BEGIN
        RAISERROR('One or more recipients not found in GlobalUsers', 16, 1);
        RETURN;
    END

    -- Insert into NotificationRecipient
    DECLARE @NotificationRecipients TABLE (
        id UNIQUEIDENTIFIER,
        recipientId UNIQUEIDENTIFIER
    );

    INSERT INTO NotificationRecipient (notificationId, recipientId)
    OUTPUT inserted.id, inserted.recipientId
    INTO @NotificationRecipients(id, recipientId)
    SELECT @notificationId, recipientId
    FROM @Recipients;

	-- Insert NotificationStatus (one row per NotificationRecipient × NotificationSchedule)
    INSERT INTO NotificationStatus (notificationRecipientId, scheduleId)
    SELECT
        nr.id,
        s.id
    FROM @NotificationRecipients nr
    CROSS JOIN @Schedules s;

    -- Return notificationId
    SELECT @notificationId AS notificationId;
END
