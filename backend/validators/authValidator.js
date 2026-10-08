const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^[0-9+\-\s]{8,15}$/;

const validateAuth = (body, { isRegister = false } = {}) => {
  const errors = [];
  const studentDobLogin = !isRegister && (body.registrationNo !== undefined || body.dateOfBirth !== undefined);
  if (studentDobLogin) {
    if (typeof body.registrationNo !== 'string' || !body.registrationNo.trim()) {
      errors.push('Registration number is required.');
    }
    if (typeof body.dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth)) {
      errors.push('Enter your date of birth.');
    } else {
      const [year, month, day] = body.dateOfBirth.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date > new Date()) {
        errors.push('Enter a valid date of birth.');
      }
    }
    return errors;
  }

  if (isRegister && !body.name) errors.push('Name is required.');
  if (!body.email || !EMAIL_REGEX.test(body.email)) errors.push('A valid email is required.');
  if (!body.password || body.password.length < 6) errors.push('Password must be at least 6 characters.');
  if (isRegister && body.role && !['STUDENT', 'FACULTY'].includes(body.role)) {
    errors.push('Public registration is limited to STUDENT or FACULTY accounts.');
  }
  if (isRegister && body.phone && !PHONE_REGEX.test(body.phone)) {
    errors.push('Enter a valid phone number.');
  }
  if (isRegister && body.year !== undefined && body.year !== '' && (!Number.isInteger(Number(body.year)) || Number(body.year) < 1 || Number(body.year) > 6)) {
    errors.push('Year must be between 1 and 6.');
  }
  if (isRegister && body.group && (typeof body.group !== 'string' || body.group.trim().length > 40)) {
    errors.push('Group must be 40 characters or fewer.');
  }
  return errors;
};

module.exports = { validateAuth, EMAIL_REGEX, PHONE_REGEX };
