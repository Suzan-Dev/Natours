/* eslint-disable */
const axios = require('axios');
import showToast from './toasts';

export const updateProfile = async (userCredentials) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/update-user',
      data: userCredentials,
    });

    if (res.data.status === 'Success') {
      showToast('success', res.data.message);
    }
  } catch (err) {
    showToast('error', err.response.data.message);
  }
};

export const updatePassword = async (userCredentials) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/update-password',
      data: userCredentials,
    });

    if (res.data.status === 'Success') {
      showToast('success', res.data.message);
    }
  } catch (err) {
    showToast('error', err.response.data.message);
  }
};
