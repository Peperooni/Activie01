const utilities = require('./utilities');
const Response = require("./response");
const TokenManager = require('./tokenManager');

// this function extract the JSON data from the body of the request
// and and pass it to controller Method
// if an error occurs it will send an error response
function processJSONBody(req, res, controller, methodName) {
    let response = new Response(res);
    let body = [];
    req.on('data', chunk => {
        body.push(chunk);
    }).on('end', () => {
        try {
            // we assume that the data is in JSON format
            if (req.headers['content-type'] === "application/json") {
                controller[methodName](JSON.parse(body));
            }
            else 
                response.unsupported();
        } catch(error){
            console.log(error);
            response.unprocessable();
        }
    });
}

exports.dispatch_TOKEN_EndPoint = function(req, res){
    let response = new Response(res);
    let url = utilities.removeQueryString(req.url);
    if (url =='/token'){
        try{
            // dynamically import the targeted controller
            // if the controller does not exist the catch section will be called
            const Controller = require('./controllers/AccountsController');
            // instanciate the controller       
            let controller =  new Controller(req, res);
            if (req.method === 'POST')
                processJSONBody(req, res, controller, 'login');
            else {
                response.notFound();
            }
            // request consumed
            return true;

        } catch(error){
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
            console.log(error);
            response.notFound();
            // request consumed
            return true;
        }
    }
    // request not consumed
    // must be handled by another middleware
    return false;
}

// {method, ControllerName, Action}
const RouteRegister = require('./routeRegister');
exports.dispatch_Registered_EndPoint = function(req, res){
    let route = RouteRegister.find(req);
    if (route != null) {
        try{
            // dynamically import the targeted controller
            // if the controllerName does not exist the catch section will be called
            const Controller = require('./controllers/' + route.modelName + "Controller");
            // instanciate the controller       
            let controller =  new Controller(req, res);
            if (route.method === 'POST' || route.method === 'PUT')
                processJSONBody(req, res, controller, route.actionName);
            else {
                controller[route.actionName](route.id);
            }
            // request consumed
            return true;

        } catch(error){
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
            console.log(error);
            response.notFound();
                // request consumed
                return true;
        }
    }
    // not an registered endpoint
    // request not consumed
    // must be handled by another middleware
    return false;

}

//////////////////////////////////////////////////////////////////////
// dispatch_API_EndPoint middleware
// parse the req.url that must have the following format:
// /api/{ressource name} or
// /api/{ressource name}/{id}
// then select the targeted controller
// using the http verb (req.method) and optionnal id
// call the right controller function
// warning: this function does not handle sub resource
// of like the following : api/resource/id/subresource/id?....
//
// Important note about controllers:
// You must respect pluralize convention: 
// For ressource name RessourName you have to name the controller
// RessourceNamesController that must inherit from Controller class
/////////////////////////////////////////////////////////////////////
exports.dispatch_API_EndPoint = function(req, res){
    let response = new Response(res);

    let controllerName = '';
    let id = undefined;

    // this function check if url contain a valid API endpoint.
    // in the process, controllerName and optional id will be extracted
    function API_Endpoint_Ok(url){
        let path = utilities.decomposePath(url);
        // by convention api endpoint start with /api/...
        if (path.isAPI) {
            if (path.model != undefined) {
                // by convention controller name -> NameController
                controllerName = utilities.capitalizeFirstLetter(path.model) + 'Controller';
                // do we have an id?
                if (path.id != undefined)
                    if (isNaN(path.id)) {
                        response.badRequest();
                        // bad id
                        return false;
                    }
                id = path.id;
                return true;
            }
        }
        // bad API endpoint
        return false;
    }
   
    if (req.url == "/api"){
        const endpoints = require('./endpoints');
        endpoints.list(res);
        return true;
    }
    if (API_Endpoint_Ok(req.url)) {
        // At this point we have a controllerName and an id holding a number or undefined value.
        // in the following, we will call the corresponding method of the controller class accordingly  
        // by using the Http verb of the request.
        // for the POST and PUT verb, will we have to extract the data from the body of the request
        try{
            // dynamically import the targeted controller
            // if the controllerName does not exist the catch section will be called
            const Controller = require('./controllers/' + controllerName);
            // instanciate the controller       
            let controller =  new Controller(req, res);

            // verify if controller need authorization
            // if so, validate the extracted token from header
            if (controller.authorize){
                if (req.headers["authorization"] != undefined) {
                    let token = req.headers["authorization"].replace('Bearer ','');
                    if (TokenManager.find(token) == null) {
                        console.log('unauthorized access!');
                        response.unAuthorized();
                        return true;
                    }
                } else {
                    console.log('unauthorized access!');
                    response.unAuthorized();
                    return true;
                }
            }
            
            if (req.method === 'GET') {
                controller.get(id);
                // request consumed
                return true;
            }
            if (req.method === 'POST'){
                processJSONBody(req, res, controller,"post");
                // request consumed
                return true;
            }
            if (req.method === 'PUT'){
                processJSONBody(req, res, controller,"put");
                // request consumed
                return true;
            }
            if (req.method === 'PATCH'){
                processJSONBody(req, res, controller,"patch");
                // request consumed
                return true;
            }
            if (req.method === 'DELETE') {
                if (!isNaN(id))
                    controller.remove(id);
                else 
                    response.badRequest();
                // request consumed
                return true;
            }
        } catch(error){
            // catch likely called because of missing controller class
            // i.e. require('./' + controllerName) failed
            // but also any unhandled error...
            console.log('endpoint not found');
            console.log(error);
            response.notFound();
                // request consumed
                return true;
        }
    }
    // not an API endpoint
    // request not consumed
    // must be handled by another middleware
    return false;
}