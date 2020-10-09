exports.capitalizeFirstLetter = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1);   
}
exports.removeQueryString = removeQueryString;

function removeQueryString(url){
    let queryStringMarkerPos = url.indexOf('?');
    if (queryStringMarkerPos > -1)
        url = url.substr(0, url.indexOf('?'));
    return url;
}

// this function decompose url path
// either
// MVC pattern /controller/action/id?querystring
// or
// API pattern /api/model/id?querystring
//
exports.decomposePath = (url) => {
    let isAPI = false;
    let model = undefined;
    let action = undefined;
    let id = undefined;
    let queryString = undefined;
    
    let path = removeQueryString(url).toLowerCase();

    if (url.indexOf('?') > -1)
        queryString = url.substring(url.indexOf('?'),url.length);

    if (path.indexOf('/api') > -1) {
        isAPI = true;
        path = path.replace('/api','')
    }

    let urlParts = path.split("/");

    if (urlParts[1] != undefined)
        model = urlParts[1];

    if (!isAPI){
        if (urlParts[2] != undefined &&  urlParts[2] !='')
            action = urlParts[2];
        else
            action = 'index';

        if (urlParts[3] != undefined) {
            id = parseInt(urlParts[3]);
        }
    } else
        if (urlParts[2] != undefined) {
            id = parseInt(urlParts[2]);
        }
   
    return {    isAPI: isAPI, 
                model: model, 
                action: action, 
                id: id, 
                queryString: queryString
            };
}