// =========================================
// 1. SELECT ELEMENTS
// =========================================
const form = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

// Group each input with its error <span> so we can validate
// and display messages together. Storing them as an object
// keyed by field name keeps the validation logic generic.
const fields = {
  name: {
    input: document.getElementById('name'),
    error: document.getElementById('nameError')
  },
  email: {
    input: document.getElementById('email'),
    error: document.getElementById('emailError')
  },
  message: {
    input: document.getElementById('message'),
    error: document.getElementById('messageError')
  }
};

// A standard, "good enough" email regex for client-side checks.
// It requires: something@something.something
// It is intentionally not a 100%-perfect RFC 5322 regex — no regex
// truly is — the real guarantee always comes from server-side
// validation (see interview Q4).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =========================================
// 2. VALIDATION HELPERS
// Each returns an error string, or '' if the field is valid.
// Keeping these pure (input in, message out) makes them easy
// to test and reuse.
// =========================================
function validateName(value) {
  if (value.trim() === '') return 'Name is required.';
  if (value.trim().length < 2) return 'Name must be at least 2 characters.';
  return '';
}

function validateEmail(value) {
  if (value.trim() === '') return 'Email is required.';
  if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address.';
  return '';
}

function validateMessage(value) {
  if (value.trim() === '') return 'Message is required.';
  if (value.trim().length < 10) return 'Message must be at least 10 characters.';
  return '';
}

const validators = {
  name: validateName,
  email: validateEmail,
  message: validateMessage
};

// =========================================
// 3. SHOW / CLEAR ERRORS FOR ONE FIELD
// =========================================
function showError(fieldName, message) {
  const { input, error } = fields[fieldName];
  error.textContent = message;
  input.classList.toggle('invalid', message !== '');
}

// Runs one field's validator and updates its UI.
// Returns true if the field is valid.
function validateField(fieldName) {
  const value = fields[fieldName].input.value;
  const message = validators[fieldName](value);
  showError(fieldName, message);
  return message === '';
}

// =========================================
// 4. VALIDATE ON BLUR (as the user leaves each field)
// This gives immediate feedback instead of waiting until
// they hit Submit, which is friendlier UX.
// =========================================
Object.keys(fields).forEach((fieldName) => {
  fields[fieldName].input.addEventListener('blur', () => {
    validateField(fieldName);
  });
});

// =========================================
// 5. HANDLE SUBMIT
// =========================================
form.addEventListener('submit', (event) => {
  // Stop the browser's default behavior, which would be to
  // reload the page and actually submit the form somewhere.
  // Since we have no backend here, we handle everything in JS.
  event.preventDefault();

  successMessage.classList.add('hidden');

  // Validate every field, and track whether ALL of them passed.
  // We deliberately validate every field (not stop at the first
  // failure) so the user sees every problem at once.
  let allValid = true;
  Object.keys(fields).forEach((fieldName) => {
    const isValid = validateField(fieldName);
    if (!isValid) allValid = false;
  });

  if (!allValid) return; // stop here if anything failed

  // All good: show success and reset the form.
  successMessage.classList.remove('hidden');
  form.reset();

  // reset() clears values but won't remove our .invalid classes
  // or leftover error text, so clear those manually too.
  Object.keys(fields).forEach((fieldName) => showError(fieldName, ''));
});