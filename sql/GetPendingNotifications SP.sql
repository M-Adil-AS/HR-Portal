USE [Global Database]
GO
/****** Object:  StoredProcedure [dbo].[GetPendingNotifications]    Script Date: 06/05/2025 5:48:03 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[GetPendingNotifications]
(
    @notificationId INT = NULL,
    @type VARCHAR(20) = NULL,
    @userEmail VARCHAR(100) = NULL
)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from interfering with SELECT statements.
    SET NOCOUNT ON;

	SELECT
        n.id AS notificationId,
		n.type,
		n.link,
		n.action,
		n.entityType,
		n.data,
        ns.id AS scheduleId, 
        ns.actionDateTime,
		nr.id AS notificationRecipientId,
        gu.email AS recipientEmail,
		gu.tenantId AS recipientTenantId,
		gu.userType AS recipientUserType,
		nst.id AS notificationStatusId,
        nst.isRead
    FROM Notifications n
    INNER JOIN NotificationSchedule ns ON ns.notificationId = n.id
    INNER JOIN NotificationRecipient nr ON nr.notificationId = n.id
    INNER JOIN GlobalUsers gu ON gu.id = nr.recipientId
    INNER JOIN NotificationStatus nst ON nst.notificationRecipientId = nr.id AND nst.scheduleId = ns.id
    WHERE
        ns.actionDateTime <= GETDATE()
        AND nst.isProcessed = 0
        AND nst.isErrored = 0

        -- Exclude if tenant or user already actioned
        AND n.isTenantActioned = 0
        AND nr.isUserActioned = 0

        -- Optional filters
        AND (@type IS NULL OR n.type = @type) -- Filter by notification type if provided
        AND (@userEmail IS NULL OR gu.email = @userEmail) -- Filter by user email if provided (only return notifications relevant to that user)
        AND (@notificationId IS NULL OR n.id = @notificationId) -- Filter by notificationId if provided

    ORDER BY ns.actionDateTime ASC;
END