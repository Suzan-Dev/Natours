/* eslint-disable */
const axios = require('axios');
import showToast from './toasts';

export const login = async (userCredentials) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/users/login',
      data: userCredentials,
    });

    if (res.data.status === 'Success') {
      setTimeout(() => {
        location.assign('/');
      }, 500);
      showToast('success', res.data.message);
    }
  } catch (err) {
    showToast('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:8000/api/v1/users/logout',
    });

    if (res.data.status === 'Success') {
      setTimeout(() => {
        location.reload(true);
      }, 100);
    }
  } catch (err) {
    showToast('error', 'Something went wrong, Please try again!');
  }
};
