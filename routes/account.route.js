const express = require('express');
const accountRoute = express.Router();
var OAuthClient = require('intuit-oauth');
const config = require('../config');

var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');

  // const user = localStorage.getItem('user')
  // var oauthClient = new OAuthClient({
  //   clientId: user.consumerKey,    // enter the apps `clientId`
  //   clientSecret: user.consumerSecret,    // enter the apps `clientSecret`
  //   environment: config.environment,   // enter either `sandbox` or `production`
  //   redirectUri: user.redirectUri +'/getToken',     // enter the redirectUri
  //   logging: true    // by default the value is `false`
  // });

  //----------------------- Get Item by Query API --------------------------//
  accountRoute.get('/getBillAccount', async (req, res) => {
    const user = localStorage.getItem('user')
  var oauthClient = new OAuthClient({
    clientId: user.consumerKey,    // enter the apps `clientId`
    clientSecret: user.consumerSecret,    // enter the apps `clientSecret`
    environment: config.environment,   // enter either `sandbox` or `production`
    redirectUri: user.redirectUri +'/getToken',     // enter the redirectUri
    logging: true    // by default the value is `false`
  });
    const token = JSON.parse(localStorage.getItem('oauthToken'));
    oauthClient.setToken(token);
    let isValid= checkToken()
    if(isValid){
      try{
        const realmId = oauthClient.getToken().realmId;
        const url =
        oauthClient.environment == 'sandbox'
            ? OAuthClient.environment.sandbox
            : OAuthClient.environment.production;
    
        const response = await oauthClient
        .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from Account`
        })
        res.status(response.response.status).json({ data :JSON.parse(response.text()).QueryResponse });
      }catch(e){
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      }
    }else{
      res.status(401).json({errorMessage: 'Unauthenticate'});
    }
})

//----------------------- Token checking --------------------------//
async function checkToken(){
    if (oauthClient.isAccessTokenValid()) {
        return true;
      }
      if (!oauthClient.isAccessTokenValid()) {
         await oauthClient
          .refresh()
          .then((authResponse) => {
            const token = authResponse.getToken();
            localStorage.setItem('oauthToken', JSON.stringify(token));
            return true;
          })
          .catch((e) => {
            console.error('The error message is :' + e.originalMessage);
            console.error(e.intuit_tid);
            return false;
          });
      }
}

module.exports = accountRoute;