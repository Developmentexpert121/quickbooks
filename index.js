const express = require('express');
const cors = require('cors');
port = process.env.PORT || 4200,
util = require('util'),
bodyParser = require('body-parser'),
cookieParser = require('cookie-parser');
var OAuthClient = require('intuit-oauth');
var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');

const config = require('./config');
var app= express();

const invoiceRouter = require('./routes/invoice.route');
const billRouter = require('./routes/bill.route');
const vendorRouter = require('./routes/vendor.route');
const customerRouter = require('./routes/customer.route');
const itemRouter = require('./routes/item.route');

app.set('port', port)
app.set('views', 'views');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser('brad'))

app.use('/invoice', invoiceRouter);
app.use('/bill', billRouter);
app.use('/vendor', vendorRouter);
app.use('/customer', customerRouter);
app.use('/item', itemRouter);

var oauthClient = new OAuthClient({
  clientId: config.consumerKey,    // enter the apps `clientId`
  clientSecret: config.consumerSecret,    // enter the apps `clientSecret`
  environment: config.environment,   // enter either `sandbox` or `production`
  redirectUri:  config.redirectUri +'/getToken',     // enter the redirectUri
  logging: true    // by default the value is `false`
});

app.get('/',(req, res) => {
  res.json('success');
})


//-----------------------Make authorize URI--------------------------//
app.get('/authUri', function(req, res) {
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
    state: 'testState',
  });
  res.status(200).json({ link: authUri})
})


//-----------------------Get Token--------------------------//
app.get('/getToken', async function(req, res) { 
  try{
    const response = await oauthClient.createToken(req.url)
      if(response.getToken()){
        token = response.getToken();
        localStorage.setItem('oauthToken', JSON.stringify(token));
        res.status(200).json({ status: 'success', data:response});
    }
  }catch(e){
    res.status(e.authResponse.response.status).json(e.authResponse.response.body)
  }
})

app.listen(4200, () => {
    console.log('app listening on port 4200');
})
