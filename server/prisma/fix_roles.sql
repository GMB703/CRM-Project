-- Fix user roles after enum update
UPDATE users SET role = 'ORG_ADMIN' WHERE role = 'MANAGER';
UPDATE users SET role = 'ORG_ADMIN' WHERE role = 'ADMIN'; 