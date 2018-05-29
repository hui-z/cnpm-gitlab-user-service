var axios = require('axios').default

function transformUser(user) {
  if (!user) return

  return {
    login: user.username,
    email: user.email,
    name: user.name,
    html_url: user.web_url,
    avatar_url: user.avatar_url,
    im_url: '',
    site_admin: user.is_admin || false
  }
}

function GitlabUserService(options) {
  options = options || {}

  this.apiPrefix = '/api/v4'
  this.gitlab = axios.create({
    baseURL: options.baseUrl,
    headers: {
      'PRIVATE-TOKEN': options.token
    }
  })
}

var proto = GitlabUserService.prototype;

/**
 * Auth user with login name and password
 * @param  {String} login    login name
 * @param  {String} password login password
 * @return {User}
 */
proto.auth = function* (login, password) {
  var user
  try {
    var response = yield this.gitlab.post('/oauth/token/', {
      grant_type: 'password',
      username: login,
      password: password
    })
    user = yield this.get(login)
  } catch (e) {
    throw e
  }

  return user
}

/**
 * Get user by login name
 * @param  {String} login  login name
 * @return {User}
 */
proto.get = function* (login) {
  var user
  try {
    var users = yield this.gitlab.get(this.apiPrefix + '/users', {
      params: {
        username: login
      }
    })
    var partialUser = users.data[0]
    if (partialUser) {
      user = yield this.gitlab.get(this.apiPrefix + '/users/' + partialUser.id)
      user = user.data
    } else {
      user = partialUser
    }
  } catch (e) {
    throw e
  }

  return transformUser(user)
}

/**
 * List users
 * @param  {Array<String>} logins  login names
 * @return {Array<User>}
 */
proto.list = function* (logins) {
  var users = []
  try {
    users = yield logins
      .map((login) => this.get(login))
    users = users.filter(user => !!user)
  } catch (e) {
    throw e
  }
  return users
}

/**
 * Search users
 * @param  {String} query  query keyword
 * @param  {Object} [options] optional query params
 *  - {Number} limit match users count, default is `20`
 * @return {Array<User>}
 */
proto.search = function* (query, options) {

}

module.exports = GitlabUserService
