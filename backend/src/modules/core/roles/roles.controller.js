const asyncHandler = require('@utils/asyncHandler');
const RolesService = require('./roles.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const createdBy = req.user.userId;
    const data = { ...req.body, companyId };
    const result = await RolesService.createRole(data, createdBy);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await RolesService.getRoles(companyId);
    res.json(result);
  }),
  get: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await RolesService.getRoleById(companyId, id);
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const result = await RolesService.updateRole(companyId, id, req.body, updatedBy);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const deletedBy = req.user.userId;
    const { id } = req.params;
    const result = await RolesService.deleteRole(companyId, id, deletedBy);
    res.json(result);
  }),
  assignPermissions: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const { permissions } = req.body;
    const result = await RolesService.assignPermissions(companyId, id, permissions, updatedBy);
    res.json(result);
  }),
  getPermissions: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await RolesService.getRolePermissions(companyId, id);
    res.json(result);
  }),
  removePermission: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id, permissionId } = req.params;
    const result = await RolesService.removePermission(companyId, id, permissionId, updatedBy);
    res.json(result);
  })
};
