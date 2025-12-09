#!/bin/bash

# Church Service Management API Setup Instructions

echo "Setting up Church Service Management API..."

# 1. Install dependencies
composer install

# 2. Copy environment file
cp .env.example .env

# 3. Generate application key
php artisan key:generate

# 4. Generate JWT secret
php artisan jwt:secret

# 5. Configure database in .env file
echo "Please update your .env file with database credentials:"
echo "DB_HOST=your_host"
echo "DB_DATABASE=church_service_db"
echo "DB_USERNAME=your_username"
echo "DB_PASSWORD=your_password"

# 6. Run migrations (after database is configured)
echo "After configuring database, run:"
echo "php artisan migrate"

# 7. Seed the database
echo "php artisan db:seed"

# 8. Start the development server
echo "php artisan serve"

echo "Setup complete! Your API will be available at http://localhost:8000"
