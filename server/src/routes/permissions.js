import express from 'express';
import { PrismaClient } from '@prisma/client';
import { isSuperAdmin } from '../middleware/superAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

// All endpoints require super admin
router.use(isSuperAdmin);

// --- Permission CRUD ---
router.post('/permissions', async (req, res) => {
  try {
    const { module, action, description } = req.body;
    const permission = await prisma.permission.create({
      data: { module, action, description }
    });
    res.status(201).json({ data: permission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create permission', details: error.message });
  }
});

router.get('/permissions', async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany();
    res.json({ data: permissions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch permissions', details: error.message });
  }
});

router.put('/permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { module, action, description } = req.body;
    const permission = await prisma.permission.update({
      where: { id },
      data: { module, action, description }
    });
    res.json({ data: permission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update permission', details: error.message });
  }
});

router.delete('/permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.permission.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete permission', details: error.message });
  }
});

// --- Role CRUD ---
router.post('/roles', async (req, res) => {
  try {
    const { name, description } = req.body;
    const role = await prisma.role.create({ data: { name, description } });
    res.status(201).json({ data: role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create role', details: error.message });
  }
});

router.get('/roles', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({ include: { permissions: true } });
    res.json({ data: roles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles', details: error.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const role = await prisma.role.update({ where: { id }, data: { name, description } });
    res.json({ data: role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role', details: error.message });
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.role.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete role', details: error.message });
  }
});

// --- Assign/Revoke Permissions to Roles ---
router.post('/roles/:roleId/permissions/:permissionId', async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    const rp = await prisma.rolePermission.create({ data: { roleId, permissionId } });
    res.status(201).json({ data: rp });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign permission to role', details: error.message });
  }
});

router.delete('/roles/:roleId/permissions/:permissionId', async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke permission from role', details: error.message });
  }
});

// --- Assign/Revoke Roles to Users ---
router.post('/users/:userId/roles/:roleId', async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    const ura = await prisma.userRoleAssignment.create({ data: { userId, roleId } });
    res.status(201).json({ data: ura });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign role to user', details: error.message });
  }
});

router.delete('/users/:userId/roles/:roleId', async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    await prisma.userRoleAssignment.deleteMany({ where: { userId, roleId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke role from user', details: error.message });
  }
});

// --- Assign/Revoke Direct Permissions to Users ---
router.post('/users/:userId/permissions/:permissionId', async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    const upg = await prisma.userPermissionGrant.create({ data: { userId, permissionId } });
    res.status(201).json({ data: upg });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign permission to user', details: error.message });
  }
});

router.delete('/users/:userId/permissions/:permissionId', async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    await prisma.userPermissionGrant.deleteMany({ where: { userId, permissionId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke permission from user', details: error.message });
  }
});

// TODO: Add audit logging for all changes
// TODO: Add validation and error handling for edge cases

export default router; 