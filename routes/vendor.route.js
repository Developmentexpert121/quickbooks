const express = require('express');
const vendorRoute = express.Router();
var OAuthClient = require('intuit-oauth');
const config = require('../config');

var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');

  var oauthClient = new OAuthClient({
    clientId: config.consumerKey,    // enter the apps `clientId`
    clientSecret: config.consumerSecret,    // enter the apps `clientSecret`
    environment: config.environment,   // enter either `sandbox` or `production`
    redirectUri: config.redirectUri +'/getToken',     // enter the redirectUri
    logging: true    // by default the value is `false`
  });

//----------------------- Get vendor using Query API --------------------------//
  vendorRoute.get('/getVendorByQuery', async (req, res) => {
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
        .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from vendor`
        })
        res.status(response.response.status).json({ data :JSON.parse(response.text()).QueryResponse });
      }catch(e){
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      }
    }else{
      res.status(401).json({errorMessage: 'Unauthenticate'});
    }
})

//----------------------- Get vendor by Id --------------------------//
vendorRoute.get('/getVendorById/:id', async (req, res) => {
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
        .makeApiCall({ url: `${url}v3/company/${realmId}/vendor/${req.params.id}`
        })
        res.status(response.response.status).json({ data :JSON.parse(response.text()) });
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
            return false;
          });
      }
}

module.exports = vendorRoute;