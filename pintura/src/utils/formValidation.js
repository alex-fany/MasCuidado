const messages = {
  es: { required: 'Completa este campo.', email: 'Ingresa un correo electrónico válido.', password: 'La contraseña debe tener al menos 6 caracteres.', name: 'El nombre no puede exceder los 30 caracteres.', match: 'Las contraseñas no coinciden.', invalid: 'Revisa el valor de este campo.' },
  en: { required: 'Complete this field.', email: 'Enter a valid email address.', password: 'The password must contain at least 6 characters.', name: 'The name cannot exceed 30 characters.', match: 'The passwords do not match.', invalid: 'Check the value of this field.' },
  pt: { required: 'Preencha este campo.', email: 'Insira um e-mail válido.', password: 'A senha deve ter pelo menos 6 caracteres.', name: 'O nome não pode exceder 30 caracteres.', match: 'As senhas não coincidem.', invalid: 'Verifique o valor deste campo.' },
};

export function validationMessage(code, language = 'es') {
  const dictionary = messages[language] || messages.es;
  return dictionary[code] || dictionary.invalid;
}

export function validateAuthFields(kind, values, language = 'es') {
  const errors = {};
  if (kind === 'register') {
    if (!values.name?.trim()) errors.name = validationMessage('required', language);
    else if (values.name.trim().length > 30) errors.name = validationMessage('name', language);
  }
  if (kind !== 'reset') {
    if (!values.email?.trim()) errors.email = validationMessage('required', language);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = validationMessage('email', language);
  }
  if (kind !== 'forgot') {
    if (!values.password) errors.password = validationMessage('required', language);
    else if (kind !== 'login' && values.password.length < 6) errors.password = validationMessage('password', language);
  }
  if (kind === 'reset') {
    if (!values.confirmPassword) errors.confirmPassword = validationMessage('required', language);
    else if (values.password !== values.confirmPassword) errors.confirmPassword = validationMessage('match', language);
  }
  return errors;
}

// Los errores ajenos a los campos visibles permanecen en el aviso general.
export function serverFieldErrors(data, allowed) {
  if (typeof data?.error !== 'string') return {};
  if (data.field === 'credentials' && allowed.includes('email') && allowed.includes('password')) return { password: data.error };
  return allowed.includes(data.field) ? { [data.field]: data.error } : {};
}

// También valida los editores que guardan mediante botones fuera de un formulario HTML.
export function validateVisibleFields(container, language = 'es') {
  const fields = [...(container?.querySelectorAll('input, select, textarea') || [])]
    .filter(field => !field.disabled && field.type !== 'hidden' && field.type !== 'file');
  let firstInvalid;
  for (const field of fields) {
    field.setCustomValidity('');
    if (field.required && !field.value.trim()) field.setCustomValidity(validationMessage('required', language));
    if (!field.checkValidity() && !firstInvalid) firstInvalid = field;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ block: 'nearest' });
    firstInvalid.reportValidity();
  }
  return !firstInvalid;
}
