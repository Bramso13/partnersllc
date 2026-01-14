-- Migration: 008_add_user_role.sql
-- Description: Add role field to profiles table for role-based access control
-- Author: Dev Agent (James)
-- Date: 2026-01-11

-- Create user_role enum with CLIENT, AGENT, ADMIN values
CREATE TYPE user_role AS ENUM ('CLIENT', 'AGENT', 'ADMIN');

-- Add role column to profiles table with default value 'CLIENT'
ALTER TABLE profiles
ADD COLUMN role user_role NOT NULL DEFAULT 'CLIENT';

-- Create index for efficient role lookups
CREATE INDEX idx_profiles_role ON profiles(role);

-- Update existing profiles to AGENT role if they exist in the agents table
-- This ensures backward compatibility with existing agent users
UPDATE profiles p
SET role = 'AGENT'
FROM agents a
WHERE p.id = a.id
  AND a.active = true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.role IS 'User role: CLIENT (default for new users), AGENT (service providers), or ADMIN (system administrators)';
COMMENT ON TYPE user_role IS 'Enum type for user roles in the system';
