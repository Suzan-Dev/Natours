/* eslint-disable */

const hideToast = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const showToast = (type, msg) => {
  hideToast();
  const toastMarkup = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', toastMarkup);
  setTimeout(() => {
    hideToast();
  }, 3000);
};

export default showToast;
