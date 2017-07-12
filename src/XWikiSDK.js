
const compact = require('lodash.compact'),
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
        this.usersSpaceName = 'Сотрудники';
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

    setUsersSpace(spaceName) {
        this.usersSpaceName = spaceName;

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
        return this._request(`/rest/wikis/${this.wikiName}/spaces/${encodeURIComponent(this.usersSpaceName)}/pages/${userLogin}`)
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
     * @param {String} spaceName
     * @returns {Request}
     */
    createPageObject(pageName, className, properties, spaceName = this.spaceName) {
        return this._request(`/rest/wikis/${this.wikiName}/spaces/${encodeURIComponent(spaceName)}/pages/${pageName}/objects`)
            .setMethod('POST')
            .setBody(Object.assign({}, {className}, properties));
    }

    getPageObjects(pageName, className, spaceName = this.spaceName) {
        return this._request(`/rest/wikis/${this.wikiName}/spaces/${encodeURIComponent(spaceName)}/pages/${pageName}/objects/${className}`);
    }

    getPageObjectProperties(pageName, className, number) {
        return this._request(`/rest/wikis/${this.wikiName}/spaces/${encodeURIComponent(this.spaceName)}/pages/${pageName}/objects/${className}/${number}/properties`);
    }

    updatePageObjectProperties(pageName, className, number, properties, spaceName = this.spaceName) {
        return this._request(`/rest/wikis/${this.wikiName}/spaces/${encodeURIComponent(spaceName)}/pages/${pageName}/objects/${className}/${number}`)
            .setMethod('PUT')
            .setBody(properties);
    }

    /**
     * @param {Object} userProps
     * @param {String} userProps.first_name
     * @param {String} userProps.last_name
     * @param {String} userProps.email
     * @param {String} userProps.password
     * @param {Number} userProps.active
     * @param {String} userLogin
     * @param {String} role
     * @returns {Request}
     */
    createUser(userProps, userLogin, role) {
        const userData = Object.assign({}, userDefaultOptions, userProps),
            additionalGroupName = role2GroupName[role],
            userProperties = {};

        for (var i = 0, keys = Object.keys(userData); i < keys.length; i++) {
            userProperties['property#' + keys[i]] = userData[keys[i]];
        }

        return this.createUserPage(userLogin, this.usersSpaceName).then(() => {
            return this.createPageObject(userLogin, 'XWiki.XWikiUsers', userProperties, this.usersSpaceName).then(() => {
                return this.createPageObject('XWikiAllGroup', 'XWiki.XWikiGroups', {
                    'property#member': 'XWiki.' + userLogin,
                }).then((res) => {
                    if (!additionalGroupName) {
                        return res;
                    }

                    return this.createPageObject(additionalGroupName, 'XWiki.XWikiGroups', {
                        'property#member': 'XWiki.' + userLogin,
                    });
                });
            });
        });
    }

    updateUser(userProps, userLogin) {
        return this.getPageObjects(userLogin, 'XWiki.XWikiUsers', this.usersSpaceName).then((resJSON) => {
            if (!resJSON.objectSummaries) {
                return Promise.reject('no such object');
            }

            const usersObject = resJSON.objectSummaries.find((obj) => obj.className === 'XWiki.XWikiUsers');

            if (!usersObject) {
                return Promise.reject('no XWiki.XWikiUsers object');
            }

            const stylizedProperties = {};

            for (var i = 0, keys = Object.keys(userProps); i < keys.length; i++) {
                stylizedProperties['property#' + keys[i]] = userProps[keys[i]];
            }

            return this.updatePageObjectProperties(userLogin, 'XWiki.XWikiUsers', usersObject.number, stylizedProperties, this.usersSpaceName);
        });
    }

    deleteUser(login) {
        return this.deletePage(login, [this.usersSpaceName]);
    }

    _request(url) {
        return new Request(url, this);
    }

    static normalizeSpaces(spaces) {
        let ret;

        if (Array.isArray(spaces)) {
            ret = '/spaces/' + spaces.map((space) => encodeURIComponent(space)).join('/spaces/');
        } else {
            ret = '/spaces/' + encodeURIComponent(spaces);
        }

        return ret;
    }
}

const role2GroupName = {
    superadmin: 'XWikiSuperAdminGroup',
    admin: 'XWikiAdminGroup',
    editor: 'XWikiEditorGroup',
};

XWikiSDK.Errors = Errors;

module.exports = XWikiSDK;
