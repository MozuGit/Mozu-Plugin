import speakeasy from 'speakeasy'

export default new class {
  generateSecret() {
    const secret = speakeasy.generateSecret({
      name: '魔族陌',
      issuer: 'Mozu-Plugin',
    })
    return {
      base32: secret.base32,
      otpauth_url: secret.otpauth_url
    }
  }

  verifyToken(secret, token, window = 1) {
    if (!secret || !token) return false
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(token).trim(),
      window,
    })
  }
}