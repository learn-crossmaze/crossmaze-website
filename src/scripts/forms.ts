// Progressive enhancement for every <form data-cm-form>.
//
// Submissions go to /api/submit, the Firebase function that saves them and forwards them to LITMUS
// (override with PUBLIC_FORM_ENDPOINT). If that can't be reached (e.g. local dev without the
// functions emulator), the visitor's email app opens with the details filled in instead, so no
// enquiry is lost.

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
  showStatus(
    form,
    'success',
    `We couldn't send this online, so your email app should open with these details filled in. If it didn't, write to us at ${mailto}.`,
  );
}

const params = new URLSearchParams(window.location.search);

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-cm-form]')) {
  // Pre-fill selects from the URL, e.g. /contact?program=Nursery
  for (const [name, value] of params) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLSelectElement && [...field.options].some((o) => o.value === value)) {
      field.value = value;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = {
      ...Object.fromEntries([...data.entries()].filter(([, v]) => typeof v === 'string')),
      form_type: form.dataset.formType,
      page: window.location.pathname,
    };
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    button?.setAttribute('disabled', '');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        showStatus(form, 'success', form.dataset.success ?? 'Thank you! We will get back to you shortly.');
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
    }
  });
}
