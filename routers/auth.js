'use strict';

const periodic = require('periodicjs');
const csrf = require('csurf');
const capitalize = require('capitalize');
const authRouter = periodic.express.Router();
const controllers = require('../controllers');
const passportControllers = periodic.controllers.extension.get('@digifi/periodicjs.ext.passport');
const utilities = require('../utilities');
const passportExtSettings = periodic.settings.extensions['@digifi/periodicjs.ext.passport'];
const passportExtOAuth2Clients = passportExtSettings.oauth.oauth2client;
// const periodicRoutingUtil = periodic.utilities.routing;
const passport = periodic.locals.extensions.get('@digifi/periodicjs.ext.passport').passport;

if (passportExtSettings.passport.use_csrf) {
  authRouter.use(csrf());
  authRouter.use(passportControllers.auth.useCSRF);
}

passportExtOAuth2Clients.forEach(oauth2client_settings => {
  const client = oauth2client_settings;
  const service_name = oauth2client_settings.service_name;
  const clientAuth = utilities.oauth.client_auth_request({ client, });
  const userAuth = utilities.oauth.user_auth_request({ client, });
  let mockUserAuthReq = {};
  let mockUserAuthRes = {};
  userAuth(mockUserAuthReq, mockUserAuthRes, () => {
    if (periodic.config.debug) {
      periodic.logger.silly(`Configured ${service_name}, OAuth2 Bearer Authentication for (${capitalize(oauth2client_settings.user_entity_type || 'user')})${oauth2client_settings.user_email}`);
    }
  });
  utilities.oauth.clientAuthToken[service_name] = clientAuth;
  // utilities.oauth.selectedUserAuthToken[service_name] = userAuth;
  authRouter.get(`/oauth2client-${service_name}`, passport.authenticate(`oauth2client-${service_name}`));
  authRouter.get(`/oauth2client-${service_name}/callback`, utilities.oauth.oauth2callback({ service_name, }));
});

module.exports = authRouter;