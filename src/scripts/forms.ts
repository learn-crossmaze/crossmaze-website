// Progressive enhancement for every <form data-cm-form>.
//
// Submissions go to /api/submit, the Firebase function that saves them and forwards them to LITMUS
// (override with PUBLIC_FORM_ENDPOINT). If that can't be reached (a weak connection, or local dev without
// the functions emulator), the details stay in the form and buttons offer to send them on WhatsApp to the
// chosen centre or by email instead, so no enquiry is lost.
//
// Mistakes are written under the field they belong to (not the browser's passing bubble), and the first one
// is brought into view below the floating header.
//
// File inputs (the resume on the careers form) are checked here for type and size, then sent in the
// same JSON body as { name, data } with the contents base64-encoded.
//
// Sending can take several seconds (the function waits until LITMUS has the details, and a resume has to
// upload first), so the button shows a spinner and a bar beside it says what is happening: how much of the
// resume has uploaded, then that the details are on their way. The messages are kept short so the bar stays
// one line high and nothing moves while it changes.

const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT || '/api/submit';

function labelFor(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  const id = field instanceof HTMLElement ? field.id : '';
  const label = id ? form.querySelector(`label[for="${id}"]`) : null;
  return label?.firstChild?.textContent?.trim() || name;
}

function showStatus(form: HTMLFormElement, state: 'success' | 'error', message: string) {
  const status = form.querySelector<HTMLElement>('.form-status');
  if (!status) return;
  status.dataset.state = state;
  status.textContent = message;
  status.hidden = false;
  status.focus();
}

/** The filled-in fields as "Label: value" lines, for a WhatsApp message or an email. */
function detailsText(form: HTMLFormElement, data: FormData) {
  return [...data.entries()]
    .filter(([name, value]) => !name.startsWith('_') && typeof value === 'string' && value.trim())
    .map(([name, value]) => `${labelFor(form, name)}: ${value}`)
    .join('\n');
}

/**
 * Sending online failed: the details stay in the form, and buttons offer to send them on WhatsApp to the
 * chosen centre (enquiries) or by email, with everything filled in.
 */
function offerOtherWays(form: HTMLFormElement, data: FormData) {
  const mailto = form.dataset.mailto ?? '';
  const subject = form.dataset.subject ?? 'Website enquiry';
  const body = detailsText(form, data);
  let chats: Record<string, string> = {};
  try {
    chats = JSON.parse(form.dataset.whatsapp ?? '{}');
  } catch {
    // No chats: email only.
  }
  const chat = chats[String(data.get('branch') ?? '')];
  const attach = form.querySelector('input[type="file"]') ? ' Please attach your resume to the email.' : '';
  showStatus(
    form,
    'error',
    `We couldn’t send this online just now. Your details are still here: send them to us ${chat ? 'on WhatsApp or ' : ''}by email instead.${attach}`,
  );
  const box = document.createElement('div');
  box.className = 'form-fallback btn-row';
  if (chat) {
    const whatsapp = document.createElement('a');
    whatsapp.className = 'btn btn--sm form-fallback__whatsapp';
    whatsapp.href = `${chat}?text=${encodeURIComponent(`${subject}\n${body}`)}`;
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener';
    whatsapp.textContent = 'Send on WhatsApp';
    box.append(whatsapp);
  }
  const email = document.createElement('a');
  email.className = 'btn btn--ghost btn--sm';
  email.href = `mailto:${mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  email.textContent = 'Send by email';
  box.append(email);
  form.querySelector('.form-status')?.after(box);
}

// ---------------------------------------------------------------- mistakes, written under each field

/** A mobile number as LITMUS accepts it: 10 digits starting 6 to 9, with or without +91, 91 or 0. */
function isMobile(value: string) {
  if (!/^[0-9 +()-]+$/.test(value.trim())) return false; // as the server allows (functions/lib/forms.js)
  const digits = value.replace(/[\s()-]/g, '').replace(/^(\+91|0091|91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits);
}

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function messageFor(field: Field) {
  const v = field.validity;
  if (v.customError) return field.validationMessage;
  if (v.valueMissing) {
    if (field instanceof HTMLSelectElement) return 'Please choose one.';
    if (field instanceof HTMLInputElement && field.type === 'file') return 'Please choose a file.';
    return 'Please fill this in.';
  }
  if (v.typeMismatch && field.type === 'email') return 'Please enter an email address, like name@example.com.';
  return field.validationMessage;
}

function clearError(field: Field) {
  field.removeAttribute('aria-invalid');
  const error = field.id ? document.getElementById(`${field.id}-error`) : null;
  if (!error) return;
  error.remove();
  const ids = (field.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id && id !== error.id);
  if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
  else field.removeAttribute('aria-describedby');
}

function showError(field: Field, message: string) {
  clearError(field);
  field.setAttribute('aria-invalid', 'true');
  if (!field.id) return;
  const error = document.createElement('p');
  error.className = 'field-error';
  error.id = `${field.id}-error`;
  error.textContent = message;
  (field.closest('.field') ?? field.parentElement)?.append(error);
  field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
}

/** Checks every field, writes what is wrong under each one and brings the first into view. */
function checkFields(form: HTMLFormElement) {
  const fields = [...form.querySelectorAll<Field>('input, select, textarea')].filter(
    (field) => !field.disabled && field.name && !field.name.startsWith('_'),
  );
  for (const field of fields) {
    if (field instanceof HTMLInputElement && 'mobile' in field.dataset) {
      field.setCustomValidity(field.value.trim() && !isMobile(field.value) ? 'Please enter a 10-digit mobile number, like 98765 43210.' : '');
    }
  }
  let first: Field | undefined;
  for (const field of fields) {
    if (field.checkValidity()) clearError(field);
    else {
      showError(field, messageFor(field));
      first ??= field;
    }
  }
  if (first) first.focus();
  return !first;
}

/** Checks a chosen file against the input's accept list and data-max-mb; the message shows on submit. */
function checkFile(input: HTMLInputElement) {
  const file = input.files?.[0];
  let message = '';
  if (file) {
    const maxMb = Number(input.dataset.maxMb) || 5;
    const extensions = input.accept.split(',').filter((a) => a.startsWith('.'));
    const ext = file.name.match(/\.[^.]+$/)?.[0].toLowerCase() ?? '';
    if (extensions.length && !extensions.includes(ext)) message = 'Please choose a PDF, Word document or photo (JPG or PNG).';
    else if (file.size > maxMb * 1024 * 1024) message = `This file is larger than ${maxMb} MB. Please choose a smaller one.`;
  }
  input.setCustomValidity(message);
}

/** The bar and the line of words beside the submit button while the form sends (global.css). */
function progressFor(form: HTMLFormElement) {
  let box = form.querySelector<HTMLElement>('.form-progress');
  if (!box) {
    box = document.createElement('div');
    box.className = 'form-progress';
    box.hidden = true;
    box.innerHTML =
      '<div class="form-progress__track" role="progressbar" aria-label="Sending"><span class="form-progress__bar"></span></div>' +
      '<p class="form-progress__text"><span role="status"></span><span class="form-progress__percent" aria-hidden="true"></span></p>';
    (form.querySelector('.btn-row') ?? form).append(box);
  }
  const panel = box;
  const track = panel.querySelector<HTMLElement>('.form-progress__track')!;
  const bar = panel.querySelector<HTMLElement>('.form-progress__bar')!;
  const words = panel.querySelector<HTMLElement>('[role="status"]')!;
  const percent = panel.querySelector<HTMLElement>('.form-progress__percent')!;
  return {
    /** Uploading: the bar fills (0-1). */
    uploading(message: string, fraction: number) {
      const value = Math.round(Math.min(Math.max(fraction, 0), 1) * 100);
      panel.hidden = false;
      panel.dataset.mode = 'upload';
      if (words.textContent !== message) words.textContent = message;
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(value));
      bar.style.width = `${value}%`;
      percent.textContent = `${value}%`;
    },
    /** Waiting for the answer: the bar sweeps. */
    waiting(message: string) {
      panel.hidden = false;
      panel.dataset.mode = 'waiting';
      if (words.textContent !== message) words.textContent = message;
      for (const name of ['aria-valuemin', 'aria-valuemax', 'aria-valuenow']) track.removeAttribute(name);
      bar.style.width = '';
      percent.textContent = '';
    },
    hide() {
      panel.hidden = true;
      words.textContent = '';
    },
  };
}

/**
 * Posts the JSON body, reporting how much of it has uploaded (fetch can't). Resolves with the status and the
 * parsed answer; rejects when the request doesn't get through at all.
 */
function post(body: string, onUpload: (fraction: number) => void) {
  return new Promise<{ ok: boolean; status: number; result: Record<string, unknown> }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && event.total) onUpload(event.loaded / event.total);
    });
    xhr.addEventListener('load', () => {
      let result = {};
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        // Not JSON (an error page): handled by its status.
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, result });
    });
    for (const failure of ['error', 'abort', 'timeout']) xhr.addEventListener(failure, () => reject(new Error(failure)));
    // A connection that stalls (a weak phone signal) gives up after a while, so the other ways to send show
    // instead of a form that waits for ever. Long enough for a resume to upload.
    xhr.timeout = 60000;
    xhr.send(body);
  });
}

const readAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const params = new URLSearchParams(window.location.search);

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-cm-form]')) {
  // Pre-fill selects from the URL, e.g. /contact?program=Nursery
  for (const [name, value] of params) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLSelectElement && [...field.options].some((o) => o.value === value)) {
      field.value = value;
    }
  }

  const fileInputs = [...form.querySelectorAll<HTMLInputElement>('input[type="file"]')];
  for (const input of fileInputs) input.addEventListener('change', () => checkFile(input));
  // A mistake's note goes as soon as the field is changed.
  for (const name of ['input', 'change']) {
    form.addEventListener(name, (event) => {
      const field = event.target as Field;
      if (field.getAttribute?.('aria-invalid') === 'true') clearError(field);
    });
  }

  let sending = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    fileInputs.forEach(checkFile);
    form.querySelector('.form-fallback')?.remove();
    if (!checkFields(form)) return;

    const data = new FormData(form);
    const payload: Record<string, unknown> = {
      ...Object.fromEntries([...data.entries()].filter(([, v]) => typeof v === 'string')),
      form_type: form.dataset.formType,
      page: window.location.pathname,
    };
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const buttonText = button?.textContent ?? '';
    const attached = fileInputs.filter((input) => input.files?.length);
    const progress = progressFor(form);
    const what = form.dataset.formType === 'job_application' ? 'application' : 'details';
    const lastStatus = form.querySelector<HTMLElement>('.form-status');
    if (lastStatus) lastStatus.hidden = true;

    // Busy until the answer comes: the button spins (keeping its width), the fields are locked (the details
    // are already taken; fields that were disabled anyway, like a hidden batch choice, stay so), and the bar
    // says what is happening. The busy state is on the button, not the form, so the bar's words are announced.
    sending = true;
    form.dataset.sending = '';
    const locked = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')].filter(
      (field) => !field.disabled,
    );
    for (const field of locked) field.disabled = true;
    if (button) {
      button.style.minWidth = `${button.getBoundingClientRect().width}px`;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'Sending…';
    }
    let answering = false;
    let slow = 0;
    const waitForAnswer = () => {
      if (answering) return;
      answering = true;
      progress.waiting(`Sending your ${what}…`);
      slow = window.setTimeout(() => progress.waiting('Almost there, please wait…'), 6000);
    };
    const done = () => {
      window.clearTimeout(slow);
      progress.hide();
      sending = false;
      delete form.dataset.sending;
      for (const field of locked) field.disabled = false;
      if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = buttonText;
        button.style.minWidth = '';
      }
    };
    if (attached.length) progress.uploading('Uploading resume…', 0);
    else waitForAnswer();

    try {
      for (const input of attached) {
        const file = input.files![0];
        payload[input.name] = { name: file.name, data: await readAsBase64(file) };
      }
    } catch {
      done();
      showStatus(form, 'error', 'We couldn’t read that file. Please choose it again.');
      return;
    }

    try {
      const { ok, status, result } = await post(JSON.stringify(payload), (fraction) => {
        if (!attached.length || answering) return;
        if (fraction < 1) progress.uploading('Uploading resume…', fraction);
        else waitForAnswer();
      });
      done();
      if (ok) {
        form.reset();
        const saved: string[] = Array.isArray(result.files) ? result.files : [];
        const missed = attached.some((input) => !saved.includes(input.name));
        const thanks = form.dataset.success ?? 'Thank you! We will get back to you shortly.';
        showStatus(
          form,
          'success',
          missed ? `${thanks} We couldn’t attach your file, so please also email it to ${form.dataset.mailto}.` : thanks,
        );
      } else if (status === 400 && Array.isArray(result.errors)) {
        showStatus(form, 'error', `Please check: ${result.errors.join('; ')}.`);
      } else if (status === 429) {
        showStatus(form, 'error', typeof result.error === 'string' ? result.error : 'Too many submissions. Please call us instead.');
      } else {
        offerOtherWays(form, data);
      }
    } catch {
      done();
      offerOtherWays(form, data);
    }
  });
}
