// Code Generator Utility (e.g., for item codes, document numbers)
function generateCode(prefix, seq, length = 5) {
  const num = String(seq).padStart(length, '0');
  return `${prefix}-${num}`;
}

module.exports = generateCode;
