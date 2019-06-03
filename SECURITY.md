
# Security

## Articles
- [Cookie Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#Security)

## Headers

<!-- * [`csrf`](https://en.wikipedia.org/wiki/Cross-site_request_forgery)
    * `enabled` (boolean): Enable or disable CSRF. Default value: depends on the environment.
    * `key` (string): The name of the CSRF token added to the model. Default value: `_csrf`.
    * `secret` (string): The key to place on the session object which maps to the server side token. Default value: `_csrfSecret`. -->

<!-- * [`csp`](https://en.wikipedia.org/wiki/Content_Security_Policy)
    * `enabled` (boolean): Enable or disable CSP to avoid Cross Site Scripting (XSS) and data injection attacks. -->

<!-- * [`p3p`](https://en.wikipedia.org/wiki/P3P)
    * `enabled` (boolean): Enable or disable p3p. -->

* [`hsts`](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security)
    * `enabled` (boolean): Enable or disable HSTS.
    * `maxAge` (integer): Number of seconds HSTS is in effect. Default value: `31536000`.
    * `includeSubDomains` (boolean): Applies HSTS to all subdomains of the host. Default value: `true`.

* [`xframe`](https://en.wikipedia.org/wiki/Clickjacking)
    * `enabled` (boolean): Enable or disable `X-FRAME-OPTIONS` headers in response.
    * `value` (string): The value for the header, e.g. DENY, SAMEORIGIN or ALLOW-FROM uri. Default value: `SAMEORIGIN`.

* [`xss`](https://en.wikipedia.org/wiki/Cross-site_scripting)
    * `enabled` (boolean): Enable or disable XSS to prevent Cross Site Scripting (XSS) attacks in older IE browsers (IE8).

* [`cors`](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
    * `enabled` (boolean): Enable or disable CORS to prevent your server to be requested from another domain.
    * `origin` (string): Allowed URLs (`http://example1.com, http://example2.com` or allows everyone `*`). Default value: `http://localhost`.
    * `expose` (array): Configures the `Access-Control-Expose-Headers` CORS header. If not specified, no custom headers are exposed. Default value: `["WWW-Authenticate", "Server-Authorization"]`.
    * `age` (integer): Configures the `Access-Control-Max-Age` CORS header. Default value: `31536000`.
    * `credentials` (boolean): Configures the `Access-Control-Allow-Credentials` CORS header. Default value: `true`.
    * `methods` (array)|String - Configures the `Access-Control-Allow-Methods` CORS header. Default value: `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]`.
    * `headers` (array): Configures the `Access-Control-Allow-Headers` CORS header. If not specified, defaults to reflecting the headers specified in the request's Access-Control-Request-Headers header. Default value: `["Content-Type", "Authorization", "X-Frame-Options"]`.

<!-- * `ip`
    * `enabled` (boolean): Enable or disable IP blocker. Default value: `false`.
    * `whiteList` (array): Whitelisted IPs. Default value: `[]`.
    * `blackList` (array): Blacklisted IPs. Default value: `[]`. -->
