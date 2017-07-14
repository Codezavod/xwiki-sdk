
declare var XWikiSDK: XWikiSDK.XWikiSDKStatic;

export = XWikiSDK;

declare namespace XWikiSDK {
    interface XWikiSDKStatic {
        normalizeSpaces(spaces: string | string[]): string;
        new (apiHost: string): XWikiSDK;
    }

    interface XWikiSDK {
        setAuth(userName: string, password: string): XWikiSDK;
        setWiki(wikiName: string): XWikiSDK;
        setSpace(spaceName: string): XWikiSDK;
        setUsersSpace(spaceName: string): XWikiSDK;
        search(query: string): SendPromise;
        pagesList(spaces: string | string[]): SendPromise;
        spacesList(): SendPromise;
        createPage(pageName: string, pageFields: PageFields, spaces: string | string[]): SendPromise;
        createUserPage(userLogin: string): SendPromise;
        deletePage(pageName: string, spaces: string | string[]): SendPromise;
        createPageObject(pageName: string, className: string, properties: object, spaceName: string): SendPromise;
        getPageObjects(pageName: string, className: string, spaceName: string): SendPromise;
        getPageObjectProperties(pageName: string, className: string, number: number): SendPromise;
        updatePageObjectProperties(pageName: string, className: string, number: number, properties: object, spaceName: string): SendPromise;
        createUser(userProps: UserProps, userLogin: string, role: string): SendPromise;
        updateUser(userProps: UserProps, userLogin: string): SendPromise;
        deleteUser(login: string): SendPromise;
        _request(url: string): Request;
    }

    interface PageFields {
        title?: string;
        content?: string;
    }

    interface UserProps {
        first_name?: string;
        last_name?: string;
        email?: string;
        password?: string;
        active?: number | boolean;
    }

    interface Request extends Promise<any> {
        new (url: string, sdk: XWikiSDK): Request;
        setQuery(query: object): Request;
        setBody(body: object): Request;
        setMethod(method: string): Request;
        setSendPlainBody(plain: boolean): Request;
        setHeader(key: string, value: string): Request;
        send(): SendPromise;
        then(): SendPromise;
        catch(): SendPromise;
        tap(): SendPromise;
    }

    interface SendPromise extends Promise<any> {}
}

