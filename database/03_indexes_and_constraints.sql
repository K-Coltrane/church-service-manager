-- Additional indexes and constraints for performance

-- Add indexes for common queries
CREATE INDEX idx_services_date ON services(started_at);
CREATE INDEX idx_services_type ON services(service_type_id);
CREATE INDEX idx_services_user ON services(user_id);
CREATE INDEX idx_attendance_service ON attendance(service_id);
CREATE INDEX idx_attendance_visitor ON attendance(visitor_id);
CREATE INDEX idx_attendance_date ON attendance(checked_in_at);

-- Add full-text search for visitor names (if supported)
ALTER TABLE visitors ADD FULLTEXT(first_name, last_name);

