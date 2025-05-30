#!/usr/bin/env python3
"""
Database migration script to add new columns for ride types and e-bike support.
Run this script to update existing databases with the new schema.
"""

import sqlite3
import os

def migrate_database():
    db_path = os.path.join('instance', 'rides.db')
    
    if not os.path.exists(db_path):
        print("No existing database found. New database will be created with updated schema.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(ride)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add ride_type column if it doesn't exist
        if 'ride_type' not in columns:
            cursor.execute("ALTER TABLE ride ADD COLUMN ride_type VARCHAR(20) DEFAULT 'mountain'")
            print("Added ride_type column to ride table")
        
        # Add ebikes_allowed column if it doesn't exist
        if 'ebikes_allowed' not in columns:
            cursor.execute("ALTER TABLE ride ADD COLUMN ebikes_allowed BOOLEAN DEFAULT 1")
            print("Added ebikes_allowed column to ride table")
        
        # Check ride_participant table
        cursor.execute("PRAGMA table_info(ride_participant)")
        participant_columns = [column[1] for column in cursor.fetchall()]
        
        # Add using_ebike column if it doesn't exist
        if 'using_ebike' not in participant_columns:
            cursor.execute("ALTER TABLE ride_participant ADD COLUMN using_ebike BOOLEAN DEFAULT 0")
            print("Added using_ebike column to ride_participant table")
        
        conn.commit()
        print("Database migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()