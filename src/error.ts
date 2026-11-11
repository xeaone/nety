export class Continue extends Error {
    code = 100;
    message = 'Continue';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class SwitchingProtocols extends Error {
    code = 101;
    message = 'Switching Protocols';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Processing extends Error {
    code = 102;
    message = 'Processing';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class EarlyHints extends Error {
    code = 103;
    message = 'Early Hints';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Ok extends Error {
    code = 200;
    message = 'OK';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Created extends Error {
    code = 201;
    message = 'Created';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Accepted extends Error {
    code = 202;
    message = 'Accepted';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class NonAuthoritativeInformation extends Error {
    code = 203;
    message = 'Non-Authoritative Information';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class NoContent extends Error {
    code = 204;
    message = 'No Content';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class ResetContent extends Error {
    code = 205;
    message = 'Reset Content';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class PartialContent extends Error {
    code = 206;
    message = 'Partial Content';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class MultiStatus extends Error {
    code = 207;
    message = 'Multi-Status';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class AlreadyReported extends Error {
    code = 208;
    message = 'Already Reported';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class ImUsed extends Error {
    code = 226;
    message = 'IM Used';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class MultipleChoices extends Error {
    code = 300;
    message = 'Multiple Choices';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class MovedPermanently extends Error {
    code = 301;
    message = 'Moved Permanently';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Found extends Error {
    code = 302;
    message = 'Found';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class SeeOther extends Error {
    code = 303;
    message = 'See Other';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class NotModified extends Error {
    code = 304;
    message = 'Not Modified';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class UseProxy extends Error {
    code = 305;
    message = 'Use Proxy';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class TemporaryRedirect extends Error {
    code = 307;
    message = 'Temporary Redirect';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class PermanentRedirect extends Error {
    code = 308;
    message = 'Permanent Redirect';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class BadRequest extends Error {
    code = 400;
    message = 'Bad Request';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Unauthorized extends Error {
    code = 401;
    message = 'Unauthorized';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class PaymentRequired extends Error {
    code = 402;
    message = 'Payment Required';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Forbidden extends Error {
    code = 403;
    message = 'Forbidden';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class NotFound extends Error {
    code = 404;
    message = 'Not Found';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class MethodNotAllowed extends Error {
    code = 405;
    message = 'Method Not Allowed';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class NotAcceptable extends Error {
    code = 406;
    message = 'Not Acceptable';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class ProxyAuthenticationRequired extends Error {
    code = 407;
    message = 'Proxy Authentication Required';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class RequestTimeout extends Error {
    code = 408;
    message = 'Request Timeout';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Conflict extends Error {
    code = 409;
    message = 'Conflict';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Gone extends Error {
    code = 410;
    message = 'Gone';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class LengthRequired extends Error {
    code = 411;
    message = 'Length Required';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class PreconditionFailed extends Error {
    code = 412;
    message = 'Precondition Failed';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class PayloadTooLarge extends Error {
    code = 413;
    message = 'Payload Too Large';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class UriTooLong extends Error {
    code = 414;
    message = 'URI Too Long';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class UnsupportedMediaType extends Error {
    code = 415;
    message = 'Unsupported Media Type';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class RangeNotSatisfiable extends Error {
    code = 416;
    message = 'Range Not Satisfiable';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class ExpectationFailed extends Error {
    code = 417;
    message = 'Expectation Failed';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class ImATeapot extends Error {
    code = 418;
    message = "I'm a Teapot";
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class MisdirectedRequest extends Error {
    code = 421;
    message = 'Misdirected Request';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class UnprocessableEntity extends Error {
    code = 422;
    message = 'Unprocessable Entity';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class Locked extends Error {
    code = 423;
    message = 'Locked';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class FailedDependency extends Error {
    code = 424;
    message = 'Failed Dependency';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class UnorderedCollection extends Error {
    code = 425;
    message = 'Unordered Collection';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class UpgradeRequired extends Error {
    code = 426;
    message = 'Upgrade Required';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class PreconditionRequired extends Error {
    code = 428;
    message = 'Precondition Required';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class TooManyRequests extends Error {
    code = 429;
    message = 'Too Many Requests';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class RequestHeaderFieldsTooLarge extends Error {
    code = 431;
    message = 'Request Header Fields Too Large';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class UnavailableForLegalReasons extends Error {
    code = 451;
    message = 'Unavailable For Legal Reasons';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class InternalServerError extends Error {
    code = 500;
    message = 'Internal Server Error';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class NotImplemented extends Error {
    code = 501;
    message = 'Not Implemented';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class BadGateway extends Error {
    code = 502;
    message = 'Bad Gateway';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class ServiceUnavailable extends Error {
    code = 503;
    message = 'Service Unavailable';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class GatewayTimeout extends Error {
    code = 504;
    message = 'Gateway Timeout';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class HttpVersionNotSupported extends Error {
    code = 505;
    message = 'HTTP Version Not Supported';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class VariantAlsoNegotiates extends Error {
    code = 506;
    message = 'Variant Also Negotiates';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class InsufficientStorage extends Error {
    code = 507;
    message = 'Insufficient Storage';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class LoopDetected extends Error {
    code = 508;
    message = 'Loop Detected';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class BandwidthLimitExceeded extends Error {
    code = 509;
    message = 'Bandwidth Limit Exceeded';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class NotExtended extends Error {
    code = 510;
    message = 'Not Extended';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export class NetworkAuthenticationRequired extends Error {
    code = 511;
    message = 'Network Authentication Required';
    constructor(message?: string) {
        super(message);
        this.message = message || this.message;
    }
}

export default {
    Continue,
    SwitchingProtocols,
    Processing,
    EarlyHints,
    Ok,
    Created,
    Accepted,
    NonAuthoritativeInformation,
    NoContent,
    ResetContent,
    PartialContent,
    MultiStatus,
    AlreadyReported,
    ImUsed,
    MultipleChoices,
    MovedPermanently,
    Found,
    SeeOther,
    NotModified,
    UseProxy,
    TemporaryRedirect,
    PermanentRedirect,
    BadRequest,
    Unauthorized,
    PaymentRequired,
    Forbidden,
    NotFound,
    MethodNotAllowed,
    NotAcceptable,
    ProxyAuthenticationRequired,
    RequestTimeout,
    Conflict,
    Gone,
    LengthRequired,
    PreconditionFailed,
    PayloadTooLarge,
    UriTooLong,
    UnsupportedMediaType,
    RangeNotSatisfiable,
    ExpectationFailed,
    ImATeapot,
    MisdirectedRequest,
    UnprocessableEntity,
    Locked,
    FailedDependency,
    UnorderedCollection,
    UpgradeRequired,
    PreconditionRequired,
    TooManyRequests,
    RequestHeaderFieldsTooLarge,
    UnavailableForLegalReasons,
    InternalServerError,
    NotImplemented,
    BadGateway,
    ServiceUnavailable,
    GatewayTimeout,
    HttpVersionNotSupported,
    VariantAlsoNegotiates,
    InsufficientStorage,
    LoopDetected,
    BandwidthLimitExceeded,
    NotExtended,
    NetworkAuthenticationRequired,
};
