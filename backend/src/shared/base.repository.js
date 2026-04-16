class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findById(id, companyId) {
    return this.model.findOne({ _id: id, companyId, isDeleted: false });
  }

  async findAll(companyId, filter = {}) {
    return this.model.find({ ...filter, companyId, isDeleted: false });
  }

  async update(id, companyId, data) {
    return this.model.findOneAndUpdate({ _id: id, companyId, isDeleted: false }, data, { new: true });
  }

  async softDelete(id, companyId) {
    return this.model.findOneAndUpdate({ _id: id, companyId }, { isDeleted: true }, { new: true });
  }

  async paginate(companyId, filter = {}, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    return this.model.find({ ...filter, companyId, isDeleted: false })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
  }
}

module.exports = BaseRepository;
