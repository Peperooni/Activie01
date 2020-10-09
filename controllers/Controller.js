const Response = require('../response.js');
const utilities = require('../utilities');
const queryString = require('query-string');
/////////////////////////////////////////////////////////////////////
// Important note about controllers:
// You must respect pluralize convention: 
// For ressource name RessourName you have to name the controller
// RessourceNamesController that must inherit from Controller class
// in order to have proper routing from request to controller action
/////////////////////////////////////////////////////////////////////
module.exports = 
class Controller {
    constructor(req, res, authorize = false) {
        this.req = req;
        this.res = res;
        // if true, will require a valid bearer token from request header
        this.authorize = authorize;
        this.response = new Response(res);
    }
    getQueryStringParams(){
        let path = utilities.decomposePath(this.req.url);
        if (path.queryString != undefined) {
            return queryString.parse(path.queryString);
        }
        return null;
    }
    queryStringParamsList() { return "";}
    get(id){
        this.response.notImplemented();
    }  
    post(obj){  
        this.response.notImplemented();
    }
    put(obj){
        this.response.notImplemented();
    }
    patch(obj){
        this.response.notImplemented();
    }
    remove(id){
        this.response.notImplemented();
    }
}