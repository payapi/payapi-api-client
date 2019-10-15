'use strict';

function validateConfig(config) {
  if (!config) {
    throw new Error('Configuration: missing constructor params');
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
}

function validateSecureformData(data) {
  if (!data) {
    throw new Error('Validation: secureform data is missing')
  }
  if (!data.order || typeof(data.order) !== 'object') {
    throw new Error('Validation: order must be a valid object');
  }
  if (!data.products || !Array.isArray(data.products) || !data.products.length ) {
    throw new Error('Validation: products must be an array with at least one product item')
  }
}

function validatePublicId(publicId) {
  if (!publicId) {
    throw new Error('Validation: publicId is mandatory');
  }
  if (!/^([a-z])[a-z0-9-_]{5,49}$/.test(publicId)) {
    throw new Error('Validation: publicId is not valid');
  }
}

module.exports = {
  validateConfig,
  validateSecureformData,
  validatePublicId
};