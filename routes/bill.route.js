const express = require('express');
const billRoute = express.Router();
var OAuthClient = require('intuit-oauth');
const config = require('../config');

var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');

// var oauthClient = new OAuthClient({
//     clientId: config.consumerKey,    // enter the apps `clientId`
//     clientSecret: config.consumerSecret,    // enter the apps `clientSecret`
//     environment: config.environment,   // enter either `sandbox` or `production`
//     redirectUri: config.redirectUri +'/getToken',     // enter the redirectUri
//     logging: true    // by default the value is `false`
//   });

//----------------------- Create Bill --------------------------//
  billRoute.post('/createBill', async (req, res) => {
    const user = localStorage.getItem('user');
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
        const response = await oauthClient.makeApiCall({ url: `${url}v3/company/${realmId}/bill`,
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      })
        res.status(response.response.status).json({ data :JSON.parse(response.text()) });
      }catch(e){
        console.log()
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      }
    }else{
      res.status(401).json({errorMessage: 'Unauthenticate'});
    }
})

//----------------------- Get all Bill list using Query  --------------------------//
billRoute.get('/getBillByQuery', async (req, res) => {
  const user = localStorage.getItem('user');
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
        .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from bill`
        })
        res.status(response.response.status).json({ data :JSON.parse(response.text()) });
      }catch(e){
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      }
    }else{
        res.status(401).json({errorMessage: 'Unauthenticate'});
    }
})

//----------------------- Get Bill data by Id --------------------------//
billRoute.get('/getBillById/:id', async (req, res) => {
  const user = localStorage.getItem('user');
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
        .makeApiCall({ url: `${url}v3/company/${realmId}/bill/${req.params.id}`
        })
        res.status(response.response.status).json({ data :JSON.parse(response.text()) });
      }catch(e){
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      }
    }else{
      res.status(401).json({errorMessage: 'Unauthenticate'});
    }
})

//----------------------- token checking --------------------------//
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


module.exports = billRoute;