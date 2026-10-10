// Progressive enhancement for every <form data-cm-form>.
//
// Submissions go to /api/submit, the Firebase function that saves them and forwards them to LITMUS
// (override with PUBLIC_FORM_ENDPOINT). If that can't be reached (e.g. local dev without the
// functions emulator), the visitor's email app opens with the details filled in instead, so no
// enquiry is lost.
//
// File inputs (the resume on the careers form) are checked here for type and size, then sent in the
// same JSON body as { name, data } with the contents base64-encoded.

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

function openEmail(form: HTMLFormElement, data: FormData) {
  const mailto = form.dataset.mailto ?? '';
  const body = [...data.entries()]
    .filter(([name, value]) => !name.startsWith('_') && typeof value === 'string' && value.trim())
    .map(([name, value]) => `${labelFor(form, name)}: ${value}`)
    .join('\n');
  window.location.href = `mailto:${mailto}?subject=${encodeURIComponent(form.dataset.subject ?? 'Website enquiry')}&body=${encodeURIComponent(body)}`;
  const attach = form.querySelector('input[type="file"]') ? ' Please attach your resume to the email.' : '';
  showStatus(
    form,
    'success',
    `We couldn't send this online, so your email app should open with these details filled in.${attach} If it didn't, write to us at ${mailto}.`,
  );
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    fileInputs.forEach(checkFile);
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload: Record<string, unknown> = {
      ...Object.fromEntries([...data.entries()].filter(([, v]) => typeof v === 'string')),
      form_type: form.dataset.formType,
      page: window.location.pathname,
    };
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const buttonText = button?.textContent ?? '';
    button?.setAttribute('disabled', '');

    const attached = fileInputs.filter((input) => input.files?.length);
    try {
      for (const input of attached) {
        const file = input.files![0];
        payload[input.name] = { name: file.name, data: await readAsBase64(file) };
      }
    } catch {
      button?.removeAttribute('disabled');
      showStatus(form, 'error', 'We couldn’t read that file. Please choose it again.');
      return;
    }
    if (button && attached.length) button.textContent = 'Uploading…';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        const saved: string[] = Array.isArray(result.files) ? result.files : [];
        const missed = attached.some((input) => !saved.includes(input.name));
        const thanks = form.dataset.success ?? 'Thank you! We will get back to you shortly.';
        showStatus(
          form,
          'success',
          missed ? `${thanks} We couldn’t attach your file, so please also email it to ${form.dataset.mailto}.` : thanks,
        );
      } else if (res.status === 400 && Array.isArray(result.errors)) {
        showStatus(form, 'error', `Please check: ${result.errors.join('; ')}.`);
      } else if (res.status === 429) {
        showStatus(form, 'error', result.error ?? 'Too many submissions. Please call us instead.');
      } else {
        openEmail(form, data);
      }
    } catch {
      openEmail(form, data);
    } finally {
      button?.removeAttribute('disabled');
      if (button) button.textContent = buttonText;
    }
  });
}
