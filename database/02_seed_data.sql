-- Seed data for church service management system

-- Insert default service types
INSERT INTO service_types (name, description) VALUES
('Sunday Morning Service', 'Main Sunday worship service'),
('Sunday Evening Service', 'Evening worship service'),
('Wednesday Bible Study', 'Midweek Bible study session'),
('Prayer Meeting', 'Weekly prayer gathering'),
('Youth Service', 'Service for young people'),
('Special Event', 'Special church events and programs');

-- Insert default admin user (password: 'password123')
INSERT INTO users (name, email, password, role) VALUES
('Church Admin', 'admin@church.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Demo User', 'demo@church.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usher');

-- Insert sample visitors for testing
INSERT INTO visitors (first_name, last_name, phone, email, inviter_name) VALUES
('John', 'Smith', '+1234567890', 'john.smith@email.com', 'Pastor Johnson'),
('Mary', 'Johnson', '+1234567891', 'mary.johnson@email.com', 'Sister Grace'),
('David', 'Brown', '+1234567892', 'david.brown@email.com', 'Brother Mike'),
('Sarah', 'Davis', '+1234567893', 'sarah.davis@email.com', 'Pastor Johnson'),
('Michael', 'Wilson', '+1234567894', 'michael.wilson@email.com', 'Sister Grace');
