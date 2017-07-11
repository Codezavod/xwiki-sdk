
const compact = require('lodash.compact'),
    isArray = require('lodash.isarray'),
    slug = require('slug'),
    Request = require('./Request'),
    Errors = require('./Errors'),
    userDefaultOptions = {
        active: 1,
    };

class XWikiSDK {
    constructor(apiHost) {
        this.apiHost = apiHost;
        this.wikiName = 'xwiki';
        this.spaceName = 'XWiki';
    }

    setAuth(userName, password) {
        this.auth = {
            user: userName,
            pass: password,
        };

        return this;
    }

    setWiki(wikiName) {
        this.wikiName = wikiName;

        return this;
    }

    setSpace(spaceName) {
        this.spaceName = spaceName;

        return this;
    }

    search(query) {
        return this._request(`/rest/wikis/query?q=${encodeURIComponent(query)}&wikis=${this.wikiName}`);
    }

    pagesList(spaces = this.spaceName) {
        const _spaces = XWikiSDK.normalizeSpaces(spaces);

        return this._request(`/rest/wikis/${this.wikiName}${_spaces}/pages`);
    }

    spacesList() {
        return this._request(`/rest/wikis/${this.wikiName}/spaces`);
    }

    /**
     * @param {String} pageName
     * @param {Object} pageFields
     * @param {String} pageFields.title
     * @param {String} pageFields.content
     * @param {String[]|String} spaces
     * @returns {Request}
     */
    createPage(pageName, pageFields, spaces = this.spaceName) {
        const _spaces = XWikiSDK.normalizeSpaces(spaces);

        return this._request(`/rest/wikis/${this.wikiName}${_spaces}/pages/${pageName}`)
            .setBody(pageFields)
            .setMethod('PUT');
    }

    createUserPage(userLogin) {
        return this._request(`/rest/wikis/${this.wikiName}/spaces/${this.spaceName}/pages/${userLogin}`)
            .setBody('{{include document="XWiki.XWikiUserSheet"/}}')
            .setMethod('PUT')
            .setSendPlainBody(true);
    }

    deletePage(pageName, spaces = this.spaceName) {
        const _spaces = XWikiSDK.normalizeSpaces(spaces);

        return this._request(`/rest/wikis/${this.wikiName}${_spaces}/pages/${pageName}`)
            .setMethod('DELETE');
    }

    /**
     * @param {String} pageName
     * @param {String} className
     * @param {Object} properties
     * @returns {Request}
     */
    createPageObject(pageName, className, properties) {
        return this._request(`/rest/wikis/${this.wikiName}/spaces/${this.spaceName}/pages/${pageName}/objects`)
            .setMethod('POST')
            .setBody(Object.assign({}, {className}, properties));
    }

    /**
     * @param {Object} options
     * @param {String} options.first_name
     * @param {String} options.last_name
     * @param {String} options.email
     * @param {String} options.password
     * @param {Number} options.active
     * @returns {Request}
     */
    createUser(options) {
        const userData = Object.assign({}, userDefaultOptions, options),
            userLogin = slug(compact([userData.first_name, userData.last_name]).join('')),
            userProperties = {};

        for (var i = 0, keys = Object.keys(userData); i < keys.length; i++) {
            userProperties['property#' + keys[i]] = userData[keys[i]];
        }

        return this.createUserPage(userLogin).then(() => {
            return this.createPageObject(userLogin, 'XWiki.XWikiUsers', userProperties).then(() => {
                return this.createPageObject('XWikiAllGroup', 'XWiki.XWikiGroups', {
                    'property#member': 'XWiki.' + userLogin,
                });
            });
        });
    }

    _request(url) {
        return new Request(url, this);
    }

    static normalizeSpaces(spaces) {
        let ret;

        if (isArray(spaces)) {
            ret = '/spaces/' + spaces.join('/spaces/');
        } else {
            ret = '/spaces/' + spaces;
        }

        return ret;
    }
}

XWikiSDK.Errors = Errors;

module.exports = XWikiSDK;
