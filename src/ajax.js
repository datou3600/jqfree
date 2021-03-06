//ajax，抽离jsonp，$.jsonp独立于$.ajax，毕竟jsonp的原理和ajax完全没有关系，如果使用$.ajax的话有些误导别人
module.exports = {
    ajax: function (opts) {

        var type = opts.type || 'GET',
            url = opts.url,
            params = opts.data,
            dataType = opts.dataType || 'json';

        type = type.toUpperCase();

        if (type === 'GET') {
            params = (function(obj){
                var str = '';

                for(var prop in obj){
                    str += prop + '=' + obj[prop] + '&'
                }
                str = str.slice(0, str.length - 1);
                return str;
            })(opts.data);
            url += url.indexOf('?') === -1 ? '?' + params : '&' + params;
        }

        // fetch api，不过fetchapi的数据比xhr请求的数据多包了一层。
        // if (fetch) {
        //     var fetchParams = {
        //         method: type
        //     };
        //     if (type === 'POST') {
        //         fetchParams.body = params;
        //     }
        //     if (opts.contentType) {
        //         fetchParams.headers['Content-Type'] = opts.contentType;
        //     }
        //     if (opts.dataType) {
        //         fetchParams.headers['Accept'] = opts.dataType;
        //     }
        //     return fetch(opts.url, fetchParams);
        // }

        var xhr = new XMLHttpRequest();
        xhr.open(type, url);

        if (opts.contentType) {
            xhr.setRequestHeader('Content-type', opts.contentType);
        }

        xhr.send(params ? params : null);

        //return promise
        return new Promise(function (resolve, reject) {
            //onload are executed just after the sync request is comple，
            //please use 'onreadystatechange' if need support IE9-
            xhr.onload = function () {
                if (xhr.status === 200) {
                    var result;
                    try {
                        result = JSON.parse(xhr.response);
                    } catch (e) {
                        result = xhr.response;
                    }
                    resolve(result);
                } else {
                    reject(xhr.response);
                }
            };

        });
    },
    jsonp: function (opts) {
        //to produce random string
        var generateRandomAlphaNum = function (len) {
            var rdmString = '';
            for (; rdmString.length < len; rdmString += Math.random().toString(36).substr(2));
            return rdmString.substr(0, len);
        }
        var url = typeof opts === 'string' ? opts : opts.url,
            callbackName = opts.callbackName || 'jsonpCallback' + generateRandomAlphaNum(10),
            callbackFn = opts.callbackFn || function () {};
        if (url.indexOf('callback') === -1) {
            url += url.indexOf('?') === -1 ? '?callback=' + callbackName :
                '&callback=' + callbackName;
        }
        if (typeof opts === 'object') {
            var params = (function(obj){
                var str = '';

                for(var prop in obj){
                    str += prop + '=' + obj[prop] + '&'
                }
                str = str.slice(0, str.length - 1);
                return str;
            })(opts.data);
            url += '&' + params;
        }
        var eleScript= document.createElement('script');
        eleScript.type = 'text/javascript';
        eleScript.id = 'jsonp';
        eleScript.src = url;
        document.getElementsByTagName('HEAD')[0].appendChild(eleScript);


        // window[callbackName] = callbackFn;
        //return promise
        return new Promise(function (resolve, reject) {
            window[callbackName] = function (json) {
                resolve(json);
            }

            //onload are executed just after the sync request is comple，
            //please use 'onreadystatechange' if need support IE9-
            eleScript.onload = function () {
                //delete the script element when a request done。
                document.getElementById('jsonp').outerHTML = '';
                eleScript = null;
            };
            eleScript.onerror = function () {
                document.getElementById('jsonp').outerHTML = '';
                eleScript = null;
                reject('error');

            }
        });
    }
};
