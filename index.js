'use strict';

const rp = require('request-promise');
const jwt = require('jwt-simple');
const validator = require('validator');

const debug = require('debug')('payapi-api-client');
//const stagUrl = 'https://staging-input.payapi.io';
const stagUrl = 'http://localhost:3000';
const prodUrl = 'https://input.payapi.io';

module.exports = function PayapiApiClient(config) {
  const apiUrl = config.isProd ? prodUrl : stagUrl;

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

    const rpOptions = {
      method: 'POST',
      json: true,
      timeout: 10000,
      uri: apiUrl + '/v1/api/auth/login',
      body: {
        key: config.apiKey,
        token: token
      }
    };

    const response = await rp(rpOptions);
    config.authenticationToken = response.token;

    return response;
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

    const rpOptions = {
      method: 'POST',
      json: true,
      timeout: 10000,
      uri: apiUrl + '/v1/api/authorized/fraud/check/' + params.ip,
      body: body
    };

    return await rp(rpOptions);
  }

  async function creditCheck(ssn, amount, countryCode = 'FI', consumerNumber = 1) {
    if (!config.authenticationToken) {
      throw new Error('You must authenticate first');
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

    const rpOptions = {
      method: 'POST',
      json: true,
      timeout: 10000,
      uri: apiUrl + '/v1/api/authorized/creditcheck',
      body: {
        ssn: ssn,
        amount: amount,
        authenticationToken: { token: config.authenticationToken },
        countryCode: countryCode,
        consumerNumber: consumerNumber
      }
    };

    return await rp(rpOptions);
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
    const rpOptions = {
      uri: url,
      timeout: 10000,
      qs: {
        sessionId: sessionId
      },
      headers: {
        'authorization': 'Bearer ' + config.authenticationToken
      },
      json: true
    };

    return await rp(rpOptions);
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
