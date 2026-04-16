const EmployeeService = require('./employee.service');
const validation = require('./employee.validation');

module.exports = {
  async create(req, res, next) {
    try {
      const data = await validation.create.validateAsync(req.body);
      const result = await EmployeeService.create(data, req.user);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
  async findAll(req, res, next) {
    try {
      const results = await EmployeeService.findAll(req.query);
      res.json(results);
    } catch (err) {
      next(err);
    }
  },
  async findById(req, res, next) {
    try {
      const result = await EmployeeService.findById(req.params.id);
      if (!result) return res.status(404).json({ message: 'Not found' });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      const data = await validation.update.validateAsync(req.body);
      const result = await EmployeeService.update(req.params.id, data, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async remove(req, res, next) {
    try {
      await EmployeeService.remove(req.params.id, req.user);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
};
