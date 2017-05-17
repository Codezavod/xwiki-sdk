# Important

This is unofficial repository. It has been written for internal use and do not fit common Open Source Project requirements.
You still can send PR or issue, but remember this.

# Installation

Install and save it to `package.json`:
```
npm i xwiki-sdk -S
```

# Usage

```javascript

const XWikiSDK = require('xwiki-sdk'),
    sdk = new XWikiSDK('http://localhost:8080'); // replace with your XWiki installation address.

sdk.setAuth('JhonDoe', 'password')
    .setWiki('xwiki');

function createUser() {
    sdk.setSpace('XWiki');

    return sdk.createUser({
        first_name: 'Agent',
        last_name: 'Smith',
        email: 'as@matrix.com',
        password: 'drowssap',
    }).then((resJSON) => {
        console.log('user created', resJSON);
    });
}

function createTestPage() {
    sdk.setAuth('AgentSmith', 'p@ssw0rd').setSpace('Main');

    return sdk.createPage('TestPage', {title: 'Test Page Title', content: 'some content \n\nnew line?'});
}

createUser().then(() => {
    return createTestPage();
}).then(() => {
    console.log('user and page created');
}).catch((err) => {
    console.error(err);
});

```

# API

* `constructor(apiHost: string)`
    
    Create new instance of SDK and set path to it.
     
* `setAuth(userName: string, password: string)`

    Set username and password. After calling this, all requests will have HTTP Basic Auth with provided credentials.

* `setWiki(wikiName: string)`

    Set wiki name. `xwiki` by default.

* `setSpace(setSpace: string)`
    
    Set space name. `XWiki` by default.

* `createPage(pageName: string, pageFields: object)`

    Creates page with `pageName` slug.
    
    `pageFields` properties:
    
    * `title` - Page title
    * `content` - Page content
    
* `createUser(options: object)`

    Creates user and adds it to "All" group.
    
    `options` properties:
    
    * `first_name`
    * `last_name`
    * `email`
    * `password`
    * `active`
