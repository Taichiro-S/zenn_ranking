import { TWITTER_API_POST_ENDPOINT } from './constants'

export function authorizeTwitterApp() {
  const service = getService()
  if (service.hasAccess()) {
    Logger.log('Already authorized')
  } else {
    const authorizationUrl = service.getAuthorizationUrl()
    Logger.log('Open the following URL and re-run the script: %s', authorizationUrl)
  }
}

function getService() {
  pkceChallengeVerifier()
  const userProps = PropertiesService.getUserProperties()
  const scriptProps = PropertiesService.getScriptProperties()
  const clientId = scriptProps.getProperty('CLIENT_ID')
  const clientSecret = scriptProps.getProperty('CLIENT_SECRET')

  // eslint-disable-next-line no-undef
  return OAuth2.createService('twitter')
    .setAuthorizationBaseUrl('https://twitter.com/i/oauth2/authorize')
    .setTokenUrl('https://api.twitter.com/2/oauth2/token?code_verifier=' + userProps.getProperty('code_verifier'))
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(userProps)
    .setScope('users.read tweet.read tweet.write offline.access')
    .setParam('response_type', 'code')
    .setParam('code_challenge_method', 'S256')
    .setParam('code_challenge', userProps.getProperty('code_challenge'))
    .setTokenHeaders({
      Authorization: 'Basic ' + Utilities.base64Encode(clientId + ':' + clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    })
}

export function authCallback(request) {
  const service = getService()
  const authorized = service.handleCallback(request)
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!')
  } else {
    return HtmlService.createHtmlOutput('Denied.')
  }
}

function pkceChallengeVerifier() {
  const userProps = PropertiesService.getUserProperties()
  if (!userProps.getProperty('code_verifier')) {
    let verifier = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

    for (let i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    const sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier)

    const challenge = Utilities.base64Encode(sha256Hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    userProps.setProperty('code_verifier', verifier)
    userProps.setProperty('code_challenge', challenge)
  }
}

export function logRedirectUri() {
  const service = getService()
  Logger.log(service.getRedirectUri())
}

export function postTweet(message) {
  const service = getService()
  if (service.hasAccess()) {
    const response = UrlFetchApp.fetch(TWITTER_API_POST_ENDPOINT, {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true,
      payload: JSON.stringify(message),
      contentType: 'application/json'
    })

    const result = JSON.parse(response.getContentText())

    Logger.log(JSON.stringify(result, null, 2))
  } else {
    Logger.log('Not Authorized')
    return null
  }
}
