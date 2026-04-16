const asyncHandler = require('@utils/asyncHandler');
const PermissionsService = require('./permissions.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const createdBy = req.user.userId;
    const result = await PermissionsService.createPermission(req.body, createdBy);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const result = await PermissionsService.getPermissions();
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const result = await PermissionsService.updatePermission(id, req.body, updatedBy);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const deletedBy = req.user.userId;
    const { id } = req.params;
    const result = await PermissionsService.deletePermission(id, deletedBy);
    res.json(result);
  }),
  seed: asyncHandler(async (req, res) => {
    const createdBy = req.user.userId;
    const { seedList } = req.body;
    const result = await PermissionsService.seedPermissions(seedList, createdBy);
    res.json(result);
  }),
  assignPermission: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const assignedBy = req.user.userId;
    const { id } = req.params;
    const { permissionId } = req.body;
    const result = await PermissionsService.assignPermission(companyId, id, permissionId, assignedBy);
    res.json(result);
  }),
  removePermission: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const removedBy = req.user.userId;
    const { id, permissionId } = req.params;
    const result = await PermissionsService.removePermission(companyId, id, permissionId, removedBy);
    res.json(result);
  }),
  getRolePermissions: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await PermissionsService.getRolePermissions(companyId, id);
    res.json(result);
  })
};
