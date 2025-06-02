function HttpResponse(status, reason, data, headers) {
    let __statusCode = parseInt(''+status);
    let __reasonPhrase = reason;
    let __data = data;
    let __headers = headers;

    this.setStatusCode = (value) => {
        __statusCode = value;
    }

    this.setReasonPhrase = (value) => {
        __reasonPhrase = value;
    }

    this.setBody = (value) => {
        __data = value;
    }

    this.setHeaders = (value) => {
        __headers = value || {};
    };

    this.statusCode = () => {
        return __statusCode;
    }

    this.reasonPhrase = () => {
        return __reasonPhrase;
    }

    this.body = () => {
        return __data;
    }

    this.headers = () => {
        return __headers;
    }

    this.containsHeader = (name) => {
        return __headers[name.toLowerCase()] !== undefined ;
    }

    this.header = (name) => {
        return __headers[name.toLowerCase()];
    }
}