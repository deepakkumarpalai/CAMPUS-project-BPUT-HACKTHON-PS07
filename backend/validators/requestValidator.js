const validateDateRange = (fromDate, toDate, fromLabel = 'From date', toLabel = 'To date') => {
  const errors = [];
  if (!fromDate) errors.push(`${fromLabel} is required.`);
  if (!toDate) errors.push(`${toLabel} is required.`);
  if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
    errors.push(`${toLabel} cannot be earlier than ${fromLabel}.`);
  }
  return errors;
};

const validateLeave = (body) => {
  const errors = [];
  if (!body.reason) errors.push('Reason is required.');
  errors.push(...validateDateRange(body.fromDate, body.toDate));
  return errors;
};

const validateGatePass = (body) => {
  const errors = [];
  if (!body.destination) errors.push('Destination is required.');
  if (!body.reason) errors.push('Reason is required.');
  if (!body.emergencyContact) errors.push('Emergency contact is required.');
  errors.push(...validateDateRange(body.departureDate, body.returnDate, 'Departure date', 'Return date'));
  return errors;
};

const validateCertificate = (body) => {
  const errors = [];
  if (!body.certificateType) errors.push('Certificate type is required.');
  if (!body.reason) errors.push('Reason is required.');
  return errors;
};

const validateCampusRequest = (body) => {
  const errors = [];
  if (!body.title) errors.push('Title is required.');
  if (!body.description) errors.push('Description is required.');
  return errors;
};

module.exports = {
  validateLeave,
  validateGatePass,
  validateCertificate,
  validateCampusRequest
};
