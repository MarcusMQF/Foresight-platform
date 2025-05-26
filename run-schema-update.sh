#!/bin/bash

# Variables - replace with your own values
SUPABASE_DB_URL="YOUR_SUPABASE_DB_URL"
SUPABASE_DB_PASSWORD="YOUR_SUPABASE_DB_PASSWORD"

# Run the update script
echo "Applying schema updates to Supabase database..."
psql "$SUPABASE_DB_URL" -f update-schema.sql

# Check if the update was successful
if [ $? -eq 0 ]; then
  echo "Schema update completed successfully!"
else
  echo "Error applying schema updates. Please check the logs."
  exit 1
fi

echo "Done!" 