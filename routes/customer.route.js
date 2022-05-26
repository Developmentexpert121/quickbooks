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
        res.send(JSON.parse(authResponse.text()));
      })
      .catch(function (e) {
        console.error(e);
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      });
    }else{
        res.send({status: 401, message: 'please login'});
    }
})

customerRoute.get('/getJobs', (req, res) => {
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
      .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from Customer where job = true`
      })
    .then(function (authResponse) {
      const customerListWithJobs = JSON.parse(authResponse.text()).QueryResponse.Customer;
      let customerIds = []
      customerListWithJobs.forEach(customer => customerIds.push(customer.ParentRef.value));
      let uniqueChars = [...new Set(customerIds)];
      customerIds = uniqueChars;
      let customerIdsStr = JSON.stringify(customerIds).replace(/[\[\]]+/g,'')
      oauthClient
        .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from Customer where Id in (${customerIdsStr.replace(/"+/g,"'")})`
    })
      .then((response) => {
        let customers = JSON.parse(response.text()).QueryResponse.Customer;
        customers.forEach(customer => {
          let result = customerListWithJobs.filter((item) => {
            return customer.Id.indexOf(item.ParentRef.value) != -1;
          });
          if(result.length) customer['JobsData'] = result;
        })
        res.send(customers);
      })
      .catch((err) => {
        res.send(JSON.parse(authResponse.text()).QueryResponse.Customer);
      })
      })
    .catch(function (e) {
      console.error(e);
      res.status(e.authResponse.response.status).json(e.authResponse.response.body)
    });
  }else{
      res.send({status: 401, message: 'please login'});
  }
})

customerRoute.get('/getCustomerById/:id', (req, res) => {
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
        .makeApiCall({ url: `${url}v3/company/${realmId}/customer/${req.params.id}`
        })
      .then((authResponse) => {
        console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
        res.send(JSON.parse(authResponse.text()));
      })
      .catch((e) => {
        console.error(e.authResponse.response);
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      });
    }else{
        res.send({status:401, errorMessage:'please login'});
    }
})

customerRoute.post('/createCustomer', (req, res) => {
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
      .makeApiCall({ url: `${url}v3/company/${realmId}/customer`,
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
  })
  .then(function (authResponse) {
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
  })
  .catch(function (e) {
      console.log(e);
      res.status(e.authResponse.response.status).send(e.authResponse.response.body)
  });
  }else{
    res.send({status: 401, message: 'please login'});
  }
})

customerRoute.post('/createCustomerwithjob', (req, res) => {
  const token = JSON.parse(localStorage.getItem('oauthToken'));
  oauthClient.setToken(token);
  let isValid= checkToken()
  if(isValid){
    if(req.body.Job == true){
      const realmId = oauthClient.getToken().realmId;
      const url =
      oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production; 
 
  oauthClient
      .makeApiCall({ url: `${url}v3/company/${realmId}/customer`,
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
  })
  .then(function (authResponse) {
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
  })

  .catch(function (e) {
      console.log(e);
      res.status(e.authResponse.response.status).send(e.authResponse.response.body)
  });
}else{
  res.send({status: 401, message:  "Job is mendatory"})
}
  }else{
    res.send({status: 401, message: 'please login'});
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
            return false;
          });
      }
}

module.exports = customerRoute;
