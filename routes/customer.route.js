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

  //----------------------- Get Customer list using Query --------------------------//
  customerRoute.get('/getCustomerByQuery', async (req, res) => {
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
        .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from Customer WHERE job = true`
        })
        res.status(response.response.status).json({ data :JSON.parse(response.text()).QueryResponse });
      }catch(e){
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      }
    }else{
      res.status(401).json({errorMessage: 'Unauthenticate'});
    }
})

  //----------------------- Get Customer data by Id --------------------------//
customerRoute.get('/getCustomerById/:id', async (req, res) => {
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
        .makeApiCall({ url: `${url}v3/company/${realmId}/customer/${req.params.id}`
        })
        res.status(response.response.status).json({ data :JSON.parse(response.text()) });
      }catch(e){
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      }
    }else{
      res.status(401).json({errorMessage: 'Unauthenticate'});
    }
})

//  ------------------ get multiple Jobs ------------------ 

customerRoute.get('/getJobs/:id', async (req, res) => {
  const token = JSON.parse(localStorage.getItem('oauthToken'));
  console.log('--------------------------------');
  oauthClient.setToken(token);
  let isValid= checkToken()
  if(isValid){
    try{
      const realmId = oauthClient.getToken().realmId;
      console.log(realmId);
      const url =
      oauthClient.environment == 'sandbox'
          ? OAuthClient.environment.sandbox
          : OAuthClient.environment.production;

      const response = await oauthClient
      .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from Customer where job = true`
      })
      const customerListWithJobs = JSON.parse(response.text()).QueryResponse.Customer;
      let customerIds = []
      customerListWithJobs.forEach(customer => customerIds.push(customer.ParentRef.value));
      let uniqueChars = [...new Set(customerIds)];
      customerIds = uniqueChars;
      let customerIdsStr = JSON.stringify(customerIds)
      let customerIdss = customerIdsStr.replace(/[\[\]']+/g,'').replace(/["]+/g,"'")
      try{
        const responseData = await oauthClient
        .makeApiCall({ url: `${url}v3/company/${realmId}/query?query=select * from Customer where Id in (${customerIdss})`
        })
        let customers = JSON.parse(responseData.text()).QueryResponse.Customer;
        customers.forEach(customer => {
          let result = customerListWithJobs.filter((item) => {
            return customer.Id.indexOf(item.ParentRef.value) != -1;
          });
          if(result.length) customer['Jobs'] = result;
        })
        res.status(200).send(customers);
      }catch(e){
        res.status(e.authResponse.response.status).json(e.authResponse.response.body)
      }
    }catch(e){
      res.status(e.authResponse.response.status).json(e.authResponse.response.body)
    }
  }else{
      res.send({status: 401, message: 'please login'});
  }
})

// ----------------------create customer and job ---------------------
customerRoute.post('/createCustomer', async (req, res) => {
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
          .makeApiCall({ url: `${url}v3/company/${realmId}/customer`,
          method: 'POST',
          headers: {
          'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body)
      })
      res.status(response.response.status).json({ data :JSON.parse(response.text()) });
    }catch(e){
      res.status(e.authResponse.response.status).json(e.authResponse.response.body)
    }
  }else{
    res.send({status: 401, message: 'please login'});
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

module.exports = customerRoute;