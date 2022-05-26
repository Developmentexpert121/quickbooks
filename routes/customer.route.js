const express = require('express');
const customerRoute = express.Router();
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


  customerRoute.get('/getCustomerByQuery', (req, res) => {
    const token = JSON.parse(localStorage.getItem('oauthToken'));
    oauthClient.setToken(token);
    let isValid= checkToken()
    if(isValid){
        const realmId = oauthClient.getToken().realmId;
        const url =
        oauthClient.environment == 'sandbox'
            ? OAuthClient.environment.sandbox
            : OAuthClient.environment.production;
    
        oauthClient
        .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from Customer`
        })
      .then(function (authResponse) {
        console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
        res.send({data : JSON.parse(authResponse.text())});
      })
      .catch(function (e) {
        console.error(e);
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      });
    }else{
        res.send('please login again');
    }
})

customerRoute.get('/getCustomerById/:id', (req, res) => {
    const token = JSON.parse(localStorage.getItem('oauthToken'));
    oauthClient.setToken(token);
    let isValid= checkToken()
    if(isValid){
        const realmId = oauthClient.getToken().realmId;
        console.log(realmId);
        const url =
        oauthClient.environment == 'sandbox'
            ? OAuthClient.environment.sandbox
            : OAuthClient.environment.production;
    
        oauthClient
        .makeApiCall({ url: `${url}v3/company/${realmId}/customer/${req.params.id}`
        })
      .then((authResponse) => {
        console.log(authResponse)
        console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
        res.send({data : JSON.parse(authResponse.text())});
      })
      .catch((e) => {
        console.error(e.authResponse.response);
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      });
    }else{
        res.send({status:false, errorMessage:'please login again'});
    }
})


function checkToken(){
    if (oauthClient.isAccessTokenValid()) {
        return true;
      }
      if (!oauthClient.isAccessTokenValid()) {
        oauthClient
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

module.exports = customerRoute;
