'use strict';

const axios = require('axios');
const jwt = require('jwt-simple');
const validator = require('validator');

const debug = require('debug')('payapi-api-client');
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
    throw new Error(response.data);
  } else {
    throw new Error('Unexpected status code received.');
  }
}

module.exports = function PayapiApiClient(config) {
  let apiUrl = config.isProd ? prodUrl : stagUrl;

  if (!config) {
    throw new Error('Configuration: missing params params');
  }
  if (config.isProd && typeof (config.isProd) !== 'boolean') {
    throw new Error('Configuration: isProd must be a boolean');
  }
  if (!config.apiKey) {
    throw new Error('Configuration: apiKey is mandatory');
  }
  if (!config.secret) {
    throw new Error('Configuration: secret is mandatory');
  }
  if (!config.password) {
    throw new Error('Configuration: password is mandatory');
  }

  // Allow development environment
  if (config.devUrl) {
    apiUrl = config.devUrl;
  }

  function generateAccessToken() {
    const payload = {
      apiKey: {
        key: config.apiKey,
        password: config.password
      }
    };
    return jwt.encode(payload, config.secret, 'HS512');
  }

  async function authenticate() {
    const token = generateAccessToken();

    const axiosOptions = {
      method: 'post',
      timeout: 10000,
      url: apiUrl + '/v1/api/auth/login',
      data: {
        key: config.apiKey,
        token: token
      },
      validateStatus: status => status >= 200 && status <= 503
    };

    const response = await axios(axiosOptions);
    if (response.status === 200) {
      config.authenticationToken = response.data.token;
    }

    return formatAxiosResponse(response);
  }

  async function fraudCheck(params) {
    if (!config.authenticationToken) {
      throw new Error('You must authenticate first');
    }
    if (!params.ip) {
      throw new Error('Validation: ip is mandatory');
    }
    const body = params;
    body.authenticationToken = { token: config.authenticationToken };

    const axiosOptions = {
      method: 'POST',
      timeout: 10000,
      url: apiUrl + '/v1/api/authorized/fraud/check/'+ params.ip,
      data: body,
      validateStatus: status => status >= 200 && status <= 503
    };

    const response = await axios(axiosOptions);

    return formatAxiosResponse(response);
  }

  async function creditCheck(ssn, amount, countryCode = 'FI', consumerNumber = 1) {
    if (!config.authenticationToken) {
      throw new Error('You must do the authentication first');
    }
    if (!ssn) {
      throw new Error('Validation: ssn must be a valid social security number');
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Validation: amount must be a valid positive number');
    }
    if (!countryCode || !validator.isISO31661Alpha2(countryCode)) {
      throw new Error('Validation: countryCode must be a valid ISO alpha-2 code');
    }
    if (!consumerNumber || isNaN(consumerNumber)) {
      throw new Error('Validation: consumerNumber must be a valid autoincremental number');
    }

    const axiosOptions = {
      method: 'post',
      timeout: 10000,
      url: apiUrl + '/v1/api/authorized/creditcheck',
      data: {
        ssn: ssn,
        amount: amount,
        authenticationToken: { token: config.authenticationToken },
        countryCode: countryCode,
        consumerNumber: consumerNumber
      },
      validateStatus: status => status >= 200 && status <= 503
    };

    const response = await axios(axiosOptions);

    return formatAxiosResponse(response);
  }

  async function getTupasUrl(redirectUrl, sessionId) {
    if (!config.authenticationToken) {
      throw new Error('You must authenticate first');
    }
    if (!redirectUrl || !validator.isURL(redirectUrl)) {
      throw new Error('Validation: redirectUrl must be a valid http/https URL');
    }
    if (sessionId && sessionId.length > 256) {
      throw new Error('Validation: sessionId is too large (max 256 characters)');
    }

    const url = apiUrl + '/v1/api/authorized/signicat/' + encodeURIComponent(redirectUrl);
    const axiosOptions = {
      url: url,
      timeout: 10000,
      params: {
        sessionId: sessionId
      },
      headers: {
        'Authorization': 'Bearer ' + config.authenticationToken
      },
      validateStatus: status => status >= 200 && status <= 503
    };

    const response = await axios(axiosOptions);

    return formatAxiosResponse(response);
  }

  return {
    apiUrl,
    authenticate,
    creditCheck,
    fraudCheck,
    generateAccessToken,
    getTupasUrl
  };
};
