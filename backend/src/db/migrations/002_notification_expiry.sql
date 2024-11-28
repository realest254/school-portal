-- Create function to update notification status
CREATE OR REPLACE FUNCTION update_notification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the notification has expired
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AND NEW.status = 'active' THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before insert or update
CREATE TRIGGER check_notification_expiry
    BEFORE INSERT OR UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_status();

-- Create function for batch updates (as a backup)
CREATE OR REPLACE FUNCTION batch_update_expired_notifications()
RETURNS void AS $$
BEGIN
    UPDATE notifications
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;
