const validateComplaint = (body) => {
  const errors = [];
  if (!body.title || body.title.trim().length < 5) errors.push('Title must be at least 5 characters.');
  if (!body.description || body.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters.');
  }
  return errors;
};

module.exports = { validateComplaint };
