const {Soup} = imports.gi;
const {HttpResponse} = require('./lib/HttpResponse');

function HttpClient() {
    function concatenate(resultConstructor, ...arrays) {
        let totalLength = 0;
        for (const arr of arrays) {
            if(arr)
                totalLength += arr.length;
        }
        const result = new resultConstructor(totalLength);
        let offset = 0;
        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    this.exec = (method, url, headers) => {
        return new Promise((resolve, reject) => {
            try {
                const session = new Soup.Session;
                const decoder = new TextDecoder();

                const message = Soup.Message.new(method.toUpperCase(), url);
                if(headers !== undefined && headers !== null) {
                    for(const header of headers) {
                        message['request-headers'].append(header.key, header.value);
                    }
                }
                session.send_async(message, 99, null, (src, result, data) => {
                    try {
                        const inputStream = session.send_finish(result);
                        if(inputStream.is_closed()) {
                            const message = `HttpClient Error: input stream is closed for url ${url}`
                            reject(message);
                        }

                        const statusCode = message.status_code || 500;
                        const reasonPhrase = message.reason_phrase || 'Internal Server Error';
                        const headers = {};
                        message.response_headers.foreach(h => {
                            headers[h.toLowerCase()] = message.response_headers.get_one(h);
                        });

                        let buffer = new Uint8Array(0);
                        while(true) {
                            const bytes = inputStream.read_bytes(4096, null);
                            if(bytes === null || bytes.get_size() === 0) {
                                break;
                            }
                            buffer = concatenate(Uint8Array, buffer, bytes.toArray());
                        }

                        const response = new HttpResponse(statusCode, reasonPhrase, null, headers);
                        let body = buffer
                        if(response.containsHeader('content-type')) {
                            const header = response.header('content-type');
                            if(
                                header.indexOf('application/json') >= 0 ||
                                header.indexOf('application/xml') >= 0 ||
                                header.indexOf('text/html') >= 0 ||
                                header.indexOf('text/plain') >= 0 ||
                                header.indexOf('text/xml') >= 0 ||
                                header.indexOf('text/x-html') >= 0)
                            {
                                body = decoder.decode(buffer);
                            }
                        }
                        response.setBody(body);
                        resolve(response);
                    } catch(e) {
                        reject(e);
                    }
                });
            } catch(e) {
                reject(e);
            }
        });
    }
}
