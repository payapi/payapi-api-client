'use strict';

const jwt = require('jwt-simple');

const stagUrl = 'https://staging-input.payapi.io';
const prodUrl = 'https://input.payapi.io';

function formatAxiosResponse(response) {
  if (response.status === 200) {
    return response.data;
  } else if (response.status === 401) {
    throw new Error('Unauthorized');
  } else if (response.status === 403) {
    throw new Error('Access denied');
  } else if (response.status === 404) {
    throw new Error('Resource not found');
  } else if (response.status >= 400 && response.status < 500) {
    throw new Error(response.data.error || response.data);
  } else {
    throw new Error('Unexpected status code received.');
  }
}

function generateToken(payload, secret) {
  return jwt.encode(payload, secret, 'HS512');
}

function decodeToken(payload, secret) {
  return jwt.decode(payload, secret, 'HS512');
}

function checkAuthentication(config) {
  if (!config.authenticationToken) {
    throw new Error('You must do the authentication first');
  }
}

function getApiUrl(config) {
  let apiUrl = config.isProd ? prodUrl : stagUrl;
  // Allow development environment
  if (config.devUrl) {
    apiUrl = config.devUrl;
  }
  return apiUrl;
}

module.exports = {
  formatAxiosResponse,
  generateToken,
  decodeToken,
  checkAuthentication,
  getApiUrl
};