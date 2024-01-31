/**
 * Converts input string or ArrayBuffer to base64url encoded string
 * @param {string | ArrayBuffer} input
 */
function b64(input) {
  const uint8Array = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  return btoa(String.fromCharCode(...uint8Array))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

/**
 * Converts input string to ArrayBuffer
 * @param {string} str
 * @returns {ArrayBuffer}
 */
function str2ab(str) {
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

export default {
  /**
   * Handler
   * @param {Request} req
   * @param {Env} env
   * @returns
   */
  async fetch(req, env) {
    if (
      req.method === 'OPTIONS' &&
      req.headers.get('origin') &&
      (req.headers.get('origin').endsWith('italks.com.ua') || req.headers.get('origin').includes('localhost'))
    ) {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': req.headers.get('origin'),
          'Access-Control-Allow-Methods': '*',
          'Access-Control-Allow-Headers': '*'
        }
      })
    }

    var url = new URL(req.url)
    if (!url.searchParams.get('sheet')) {
      return new Response(JSON.stringify({ message: 'sheet missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (!url.searchParams.get('range')) {
      return new Response(JSON.stringify({ message: 'range missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    var key = await crypto.subtle.importKey(
      'pkcs8',
      str2ab(atob(env.PRIVATE_KEY.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', ''))),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
    var header = b64(JSON.stringify({ typ: 'JWT', alg: 'RS256' }))
    var payload = b64(
      JSON.stringify({
        aud: 'https://www.googleapis.com/oauth2/v4/token',
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 600,
        iss: env.CLIENT_EMAIL,
        scope: 'https://www.googleapis.com/auth/spreadsheets'
      })
    )
    var signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${payload}`))
    var { access_token } = await fetch(`https://www.googleapis.com/oauth2/v4/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${header}.${payload}.${b64(signature)}`
      })
    }).then(r => r.json())

    var { values } = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${url.searchParams.get('sheet')}/values/${url.searchParams.get('range')}`,
      {
        headers: { authorization: `Bearer ${access_token}` }
      }
    ).then(res => res.json())
    return new Response(JSON.stringify(values, null, 2), { headers: { 'content-type': 'application/json' } })
  }
}
