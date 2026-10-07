// Progressive enhancement for every <form data-cm-form>.
// With PUBLIC_FORM_ENDPOINT set, submissions are POSTed there (Formspree,
// Web3Forms, Getform or your own API). Without it, the visitor's email app
// opens with the details filled in, addressed to the school.

const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT;

function labelFor(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  const id = field instanceof HTMLElement ? field.id : '';
  const label = id ? form.querySelector(`label[for="${id}"]`) : null;
  return label?.firstChild?.textContent?.trim() || name;
}

function showStatus(form: HTMLFormElement, state: 'success' | 'error' | 'info', message: string) {
  const status = form.querySelector<HTMLElement>('.form-status');
  if (!status) return;
  status.dataset.state = state === 'info' ? 'success' : state;
  status.textContent = message;
  status.hidden = false;
  status.focus();
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
    if (data.get('_gotcha')) return; // honeypot filled in: silently drop bots
    data.delete('_gotcha');

    const subject = form.dataset.subject ?? 'Website enquiry';
    const mailto = form.dataset.mailto ?? '';
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    if (endpoint) {
      data.set('_subject', subject);
      button?.setAttribute('disabled', '');
      try {
        const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        showStatus(form, 'success', form.dataset.success ?? 'Thank you! We will get back to you shortly.');
      } catch {
        showStatus(
          form,
          'error',
          `Sorry, something went wrong. Please try again, or email us at ${mailto}.`,
        );
      } finally {
        button?.removeAttribute('disabled');
      }
      return;
    }

    const body = [...data.entries()]
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([name, value]) => `${labelFor(form, name)}: ${value}`)
      .join('\n');
    window.location.href = `mailto:${mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showStatus(
      form,
      'info',
      `Your email app should open with these details filled in. If it didn't, write to us at ${mailto}.`,
    );
  });
}
