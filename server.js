function ShowRequestInfo(req){
    console.log(`User agent:${req.headers["user-agent"]}`);
    if (req.headers["content-type"] != undefined)
        console.log(`Content-type:${req.headers["content-type"]}`);
    if (req.headers["authorization"] != undefined)
        console.log(`Authorisation:${req.headers["authorization"]}`);
    console.log(`Method:${req.method}`);
    console.log(`Path:${req.url}`);
}
function AccessControlConfig(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');    
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credential', false);    
    res.setHeader('Access-Control-Allow-Max-Age', '86400'); // 24 hours
}
function CORS_Prefligth(req, res){  
    if (req.method === 'OPTIONS'){
        console.log('preflight CORS verifications');
        res.end();
        // request handled
        return true;
    }
    // request not handled
    return false;
}
function notFound(res) {
    res.writeHead(404, {'content-type':'text/plain'});
    res.end();
}
function API_Endpoint(req, res) {
    return require('./router').dispatch_API_EndPoint(req, res);
}
function TOKEN_Endpoint(req, res) {
    return require('./router').dispatch_TOKEN_EndPoint(req, res);
}
function registered_Enpoint(req, res) {
    return require('./router').dispatch_Registered_EndPoint(req, res);
}
function routeConfig() {
    const RouteRegister = require('./routeRegister');
    RouteRegister.add('GET','accounts');
    RouteRegister.add('POST','accounts','register');
}
const utilities = require('./utilities');
const PORT = process.env.PORT || 5000;

routeConfig();
require('http').createServer((req, res) => {
    // Middlewares pipeline
    ShowRequestInfo(req);
    console.log(utilities.decomposePath(req.url));
    AccessControlConfig(res);
    if (!CORS_Prefligth(req, res))
    if (!TOKEN_Endpoint(req, res))
    if (!registered_Enpoint(req, res))
    if (!API_Endpoint(req, res))
    // do something else with request
    notFound(res);
}).listen(PORT, () => console.log(`HTTP Server running on port ${PORT}...`));