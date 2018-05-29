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

  instance.interceptors.request.use(
    function(response) { return response },
    function(error) {
      var status = error.status || -1

      if (status === 404) {
        return null;
      }

      var data = error.data || {};
      var message = data.error || 'status ' + status;
      var err = new Error(message);
      err.status = status;
      err.headers = error.request.headers;
      err.raw = data;
      if (status >= 400 && status < 500) {
        err.name = 'NpmClientError';
      } else {
        err.name = 'NpmServerError';
      }
      throw err;
    }
  )
}

var proto = GitlabUserService.prototype;

/**
 * Auth user with login name and password
 * @param  {String} login    login name
 * @param  {String} password login password
 * @return {User}
 */
proto.auth = function* (login, password) {
  var response = yield this.gitlab.post('/oauth/token/', {
    grant_type: 'password',
    username: login,
    password: password
  })
  var user = yield this.get(login)

  return user
}

/**
 * Get user by login name
 * @param  {String} login  login name
 * @return {User}
 */
proto.get = function* (login) {
  var users = yield this.gitlab.get(this.apiPrefix + '/users', {
    params: {
      username: login
    }
  })
  var partialUser = users.data[0]
  var user
  if (partialUser) {
    user = yield this.gitlab.get(this.apiPrefix + '/users/' + partialUser.id)
    user = user.data
  } else {
    user = partialUser
  }

  return transformUser(user)
}

/**
 * List users
 * @param  {Array<String>} logins  login names
 * @return {Array<User>}
 */
proto.list = function* (logins) {
  var users = yield logins
    .map((login) => this.get(login))
  users = users.filter(user => !!user)
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
