// The phone action bar (BaseLayout.astro): it steps aside while an enquiry or job form is on screen, so it
// never covers the form's fields or its send button. Typing and the open menu hide it in CSS.
const bar = document.querySelector<HTMLElement>('[data-action-bar]');
const forms = [...document.querySelectorAll<HTMLFormElement>('form[data-cm-form]')];

if (bar && forms.length && 'IntersectionObserver' in window) {
  const onScreen = new Set<Element>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) onScreen.add(entry.target);
      else onScreen.delete(entry.target);
    }
    bar.toggleAttribute('data-hidden', onScreen.size > 0);
  });
  for (const form of forms) observer.observe(form);
}

export {};
