const Repository = require('../models/Repository');
const Validator = require('../models/validator');
const utilities = require('../utilities');


module.exports =
    class BookmarksController extends require('./Controller') {
        constructor(req, res) {
            super(req, res);
            this.bookmarksRepository = new Repository('Bookmarks');
            this.bookmarksValidator = new Validator();
        }
        // GET: api/bookmarks                     obtien les bookmarks en ordre croissant
        // GET: api/bookmarks/{id}
        get(id) {
            let params = this.getQueryStringParams();
            if (!isNaN(id))
                this.response.JSON(this.bookmarksRepository.get(id));
            else {
                if (params == null) {
                    this.response.JSON(this.bookmarksRepository.getAll());
                }
                else if (Object.keys(params).length == 0) {
                    this.queryStringHelp();
                }
                else {
                    params = this.removeGuillemet(params);
                    if (this.checkParams(params)) {
                        this.applyParameters(params)
                    }
                }
            }
        }
        // POST: api/bookmarks  POST Body raw JSON
        post(bookmark) {
            // todo : validate contact before insertion
            // todo : avoid duplicates
            let newBookmark;
            if (this.validateBookmark(bookmark))
                newBookmark = this.bookmarksRepository.add(bookmark);

            if (newBookmark)
                this.response.created(newBookmark);
            else
                this.response.internalError();
        }
        /// PUT: api/bookmarks/id  POST Body raw JSON
        // When no parameter is given the server crashes before entering the function...
        put(bookmark) {
            // todo : validate contact before updating
            let idToChange = utilities.decomposePath(this.req.url).id;
            if (this.bookmarksValidator.valueValid(idToChange, "integer")) {
                bookmark.Id = idToChange;
                if (this.validateBookmark(bookmark) && this.bookmarksRepository.get(bookmark.Id) != null)
                    if (this.bookmarksRepository.update(bookmark))
                        this.response.ok();
                    else
                        this.response.notFound();
                else
                    this.response.badRequest();
            }
            else
                this.response.badRequest();
        }
        // DELETE: api/bookmarks/{id}
        remove(id) {
            if (this.bookmarksRepository.remove(id))
                this.response.accepted();
            else
                this.response.notFound();
        }

        checkParams(params) {
            let arrayParams = Object.keys(params);
            let countName = 0;
            let countCat = 0;
            let countSort = 0;

            if (arrayParams.length > 3)
                return this.error(params, "the maximum of parameter is three");

            for (let i = 0; i < arrayParams.length; i++) {
                switch (arrayParams[i]) {
                    case "name":
                        countName++;
                        break;
                    case "category":
                        countCat++;
                        break;
                    case "sort":
                        if (!(params['sort'] == "name" || params['sort'] == "category")) {
                            return this.error(params, "the value of the paramter 'sort' can only be 'name' or 'category'");
                        }
                        countSort++;
                        break;
                    default:
                        return this.error(params, "the parameter #" + (i + 1) + " is invalid ");
                }
            }
            if (countName > 1) {
                return this.error(params, "the parameter 'name' can only be there one time ");
            }
            if (countCat > 1) {
                return this.error(params, "the parameter 'category' can only be there one time ");
            }
            if (countSort > 1) {
                return this.error(params, "the parameter 'sort' can only be there one time ");
            }

            return true;
        }

        applyParameters(params) {
            let arrayKey = Object.keys(params);
            let arrayValue = Object.values(params);

            let responses = [];
            let trueResponse = [];

            let Sort = -1;

            for (let i = 0; i < arrayKey.length; i++) {
                switch (arrayKey[i]) {
                    case "name":
                        if (arrayValue[i].endsWith('*')) {
                            arrayValue[i] = arrayValue[i].substring(0, arrayValue[i].length - 1);
                            responses.push(this.bookmarksRepository.getByKeyStartBy('Name', arrayValue[i]));
                        } else {
                            responses.push(this.bookmarksRepository.getByKey('Name', arrayValue[i]));
                        }
                        break;
                    case "category":
                        responses.push(this.bookmarksRepository.getByKey('Category', arrayValue[i]));
                        break;
                    case "sort":
                        Sort = i;
                        break;
                    default:
                        break;
                }
            }

            if (responses.length == 0) {
                trueResponse = this.bookmarksRepository.getAll();
            }
            else if (responses.length == 1) {
                trueResponse = responses[0];
            }
            else if (responses.length >= 2) {
                let i;
                for (i = 0; i < responses.length - 1; i++) {
                    responses[i + 1] = responses[i].filter(function (val) {
                        return responses[i + 1].indexOf(val) != -1;
                    });
                }
                trueResponse = responses[i];
            }

            if (trueResponse.length == 0) {
                return this.response.JSON(trueResponse);
            }

            if (Sort != -1) {
                if (arrayValue[Sort] == 'name') {
                    responses = this.sort(trueResponse, 'Name')
                }
                else {
                    responses = this.sort(trueResponse, 'Category')
                }
            }

            return this.response.JSON(trueResponse);
        }

        removeGuillemet(params) {
            let arrayKey = Object.keys(params);
            for (let i = 0; i < arrayKey.length; i++) {
                params[arrayKey[i]] = params[arrayKey[i]].replace(/"/g, '');
            }
            return params;
        }

        sort(objects, key) {
            objects.sort(function (a, b) {
                var nameA = a[key].toUpperCase();
                var nameB = b[key].toUpperCase();
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }

                return 0;
            });

            return objects;
        }


        queryStringParamsList() {
            // expose all the possible query strings
            let content = "<div style=font-family:arial>";
            content += "<h4>List of possible parameters in query strings:</h4>";
            content += "<h4>? name = \"x\" <br> return { list of bookmarks with name = \"x\"} </h4>";
            content += "<h4>? sort = \"name\" <br> return { list of bookmarks sort by \"name\"} </h4>";
            content += "<h4>? sort = \"categorie\" <br> return { list of bookmarks sort by \"categorie\"} </h4>";
            content += "<h4>? name = \"x*\" <br> return { list of bookmarks with name start with \"x\"} </h4>";
            content += "<h4>? categorie = \"x\" <br> return { list of bookmarks with categorie = \"x\"} </h4>";
            content += "</div>"
            return content;
        }
        queryStringHelp() {

            this.res.writeHead(200, { 'content-type': 'text/html' });
            this.res.end(this.queryStringParamsList());
        }

        error(params, message) {
            params["error"] = message;
            this.response.JSON(params);
            return false;
        }


        //validate the params of the bookmark (nothing empty or unaccepted)
        validateBookmark(bookmark) {
            return (this.bookmarksValidator.valueValid(bookmark.Name, "string") &&
                this.bookmarksValidator.valueValid(bookmark.Url, "url") &&
                this.bookmarksValidator.valueValid(bookmark.Category, "string"));
        }
    }