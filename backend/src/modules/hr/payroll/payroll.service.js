const BaseService = require('../../../shared/base.service');
const PayrollRepository = require('./payroll.repository');
const SalaryStructure = require('../../industry/hr/salaryStructure.model');
const NumberSeriesService = require('../../../shared/numberSeries.service');
const JournalEntryService = require('../../engines/accountingEngine/journalEntry.service');
const Payroll = require('./payroll.model');

class PayrollService extends BaseService {
  constructor() {
    super(PayrollRepository);
  }

  // Payroll Processing
  async processPayroll({ companyId, employeeId, payPeriodStart, payPeriodEnd, createdBy }) {
    // 1. Get latest salary structure
    const salary = await SalaryStructure.findOne({ companyId, employee: employeeId, status: 'Active' }).sort({ effectiveFrom: -1 });
    if (!salary) throw new Error('No active salary structure found for employee');
    const basicSalary = salary.basic;
    const allowances = salary.allowances || 0;
    const deductions = salary.deductions || 0;
    const netSalary = basicSalary + allowances - deductions;
    // 2. Generate document number
    const documentNo = await NumberSeriesService.generateMasterCode(companyId, 'payroll');
    // 3. Create payroll record
    const payroll = await Payroll.create({
      companyId,
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      basicSalary,
      allowances,
      deductions,
      netSalary,
      documentNo,
      status: 'Processed',
      createdBy
    });
    return payroll;
  }

  // Payroll Posting
  async postPayroll(payrollId, user) {
    const payroll = await Payroll.findById(payrollId);
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.status !== 'Processed') throw new Error('Payroll must be in Processed status to post');
    // 1. Create journal entry
    const journal = await JournalEntryService.repository.create({
      company: payroll.companyId,
      journalNumber: 'AUTO', // Should use number series if needed
      journalDate: new Date(),
      referenceNumber: payroll.documentNo,
      description: `Payroll Posting for ${payroll.documentNo}`,
      totalDebit: payroll.netSalary,
      totalCredit: payroll.netSalary,
      status: 'Posted',
      lines: [
        { account: 'SALARY_EXPENSE', debit: payroll.netSalary, credit: 0, description: 'Salary Expense' },
        { account: 'SALARY_PAYABLE', debit: 0, credit: payroll.netSalary, description: 'Salary Payable' }
      ],
      createdBy: user._id
    });
    // 2. Update payroll
    payroll.journalId = journal._id;
    payroll.status = 'Posted';
    payroll.updatedBy = user._id;
    await payroll.save();
    return payroll;
  }
}

module.exports = new PayrollService();
