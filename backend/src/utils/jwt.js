const jwt = require('jsonwebtoken');
const env = require('../config/env');

const JWT_ISSUER = 'sisca-api';
const JWT_AUDIENCE = 'sisca-client';

function getJwtSecret() {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return env.jwtSecret;
}

function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

module.exports = { signToken, verifyToken };
