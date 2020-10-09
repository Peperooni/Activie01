const utilities = require('./utilities');

// Used to register custom routes
// must be used to support MVC controllers routes
module.exports = 
class RouteRegister{
    static routes = [];
    static add(method, modelName, actionName="index"){
        RouteRegister.routes.push(
            {   method: method, 
                modelName: modelName, 
                actionName: actionName
            });
    }
    static find(req) {
        let path = utilities.decomposePath(req.url);
        let foundRoute = null;
        RouteRegister.routes.forEach(route => {
            if (route.method == req.method){
                if (path.model != undefined && path.model == route.modelName) {
                    if (path.action != undefined && path.action == route.actionName) {
                        route.id = path.id;
                        foundRoute = route;
                    }
                }
            }
        });
        return foundRoute;
    }
}