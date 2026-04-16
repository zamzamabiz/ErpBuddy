const BaseService = require('@shared/base.service');
const CompanyRepository = require('./company.repository');
const apiResponse = require('@utils/apiResponse');

class CompanyService extends BaseService {
  constructor() {
    super(CompanyRepository);
  }

  async createCompany(data) {
    // Business logic for company creation can be added here
    const company = await CompanyRepository.create(data);
    return apiResponse({ success: true, message: 'Company created', data: company });
  }

  async getCompanies(companyId, filter = {}) {
    const companies = await CompanyRepository.findAll(companyId, filter);
    return apiResponse({ success: true, data: companies });
  }

  async getCompanyById(companyId, id) {
    const company = await CompanyRepository.findById(id, companyId);
    if (!company) throw new Error('Company not found');
    return apiResponse({ success: true, data: company });
  }

  async updateCompany(companyId, id, data) {
    const company = await CompanyRepository.update(id, companyId, data);
    if (!company) throw new Error('Company not found or update failed');
    return apiResponse({ success: true, message: 'Company updated', data: company });
  }

  async deleteCompany(companyId, id) {
    const company = await CompanyRepository.softDelete(id, companyId);
    if (!company) throw new Error('Company not found or delete failed');
    return apiResponse({ success: true, message: 'Company deleted', data: company });
  }
}

module.exports = new CompanyService();
