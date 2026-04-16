const asyncHandler = require('@utils/asyncHandler');
const UsersService = require('./users.service');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const createdBy = req.user.userId;
    const data = { ...req.body, companyId };
    const result = await UsersService.createUser(data, createdBy);
    res.json(result);
  }),
  list: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await UsersService.getUsers(companyId);
    res.json(result);
  }),
  get: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const result = await UsersService.getUserById(companyId, id);
    res.json(result);
  }),
  update: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const result = await UsersService.updateUser(companyId, id, req.body, updatedBy);
    res.json(result);
  }),
  delete: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const deletedBy = req.user.userId;
    const { id } = req.params;
    const result = await UsersService.deleteUser(companyId, id, deletedBy);
    res.json(result);
  }),
  activate: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const result = await UsersService.activateUser(companyId, id, updatedBy);
    res.json(result);
  }),
  deactivate: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const result = await UsersService.deactivateUser(companyId, id, updatedBy);
    res.json(result);
  }),
  changePassword: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    const result = await UsersService.changePassword(companyId, id, oldPassword, newPassword, updatedBy);
    res.json(result);
  }),
  resetPassword: asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const updatedBy = req.user.userId;
    const { id } = req.params;
    const { newPassword } = req.body;
    const result = await UsersService.resetPassword(companyId, id, newPassword, updatedBy);
    res.json(result);
  })
};
