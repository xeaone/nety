
class Continue extends Error {
    code = 100
    message = "Continue"
    constructor (message) { super(message); this.message = message || this.message; }
}

class SwitchingProtocols extends Error {
    code = 101
    message = "Switching Protocols"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Processing extends Error {
    code = 102
    message = "Processing"
    constructor (message) { super(message); this.message = message || this.message; }
}

class EarlyHints extends Error {
    code = 103
    message = "Early Hints"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Ok extends Error {
    code = 200
    message = "OK"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Created extends Error {
    code = 201
    message = "Created"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Accepted extends Error {
    code = 202
    message = "Accepted"
    constructor (message) { super(message); this.message = message || this.message; }
}

class NonAuthoritativeInformation extends Error {
    code = 203
    message = "Non-Authoritative Information"
    constructor (message) { super(message); this.message = message || this.message; }
}

class NoContent extends Error {
    code = 204
    message = "No Content"
    constructor (message) { super(message); this.message = message || this.message; }
}

class ResetContent extends Error {
    code = 205
    message = "Reset Content"
    constructor (message) { super(message); this.message = message || this.message; }
}

class PartialContent extends Error {
    code = 206
    message = "Partial Content"
    constructor (message) { super(message); this.message = message || this.message; }
}

class MultiStatus extends Error {
    code = 207
    message = "Multi-Status"
    constructor (message) { super(message); this.message = message || this.message; }
}

class AlreadyReported extends Error {
    code = 208
    message = "Already Reported"
    constructor (message) { super(message); this.message = message || this.message; }
}

class ImUsed extends Error {
    code = 226
    message = "IM Used"
    constructor (message) { super(message); this.message = message || this.message; }
}

class MultipleChoices extends Error {
    code = 300
    message = "Multiple Choices"
    constructor (message) { super(message); this.message = message || this.message; }
}

class MovedPermanently extends Error {
    code = 301
    message = "Moved Permanently"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Found extends Error {
    code = 302
    message = "Found"
    constructor (message) { super(message); this.message = message || this.message; }
}

class SeeOther extends Error {
    code = 303
    message = "See Other"
    constructor (message) { super(message); this.message = message || this.message; }
}

class NotModified extends Error {
    code = 304
    message = "Not Modified"
    constructor (message) { super(message); this.message = message || this.message; }
}

class UseProxy extends Error {
    code = 305
    message = "Use Proxy"
    constructor (message) { super(message); this.message = message || this.message; }
}

class TemporaryRedirect extends Error {
    code = 307
    message = "Temporary Redirect"
    constructor (message) { super(message); this.message = message || this.message; }
}

class PermanentRedirect extends Error {
    code = 308
    message = "Permanent Redirect"
    constructor (message) { super(message); this.message = message || this.message; }
}

class BadRequest extends Error {
    code = 400
    message = "Bad Request"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Unauthorized extends Error {
    code = 401
    message = "Unauthorized"
    constructor (message) { super(message); this.message = message || this.message; }
}

class PaymentRequired extends Error {
    code = 402
    message = "Payment Required"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Forbidden extends Error {
    code = 403
    message = "Forbidden"
    constructor (message) { super(message); this.message = message || this.message; }
}

class NotFound extends Error {
    code = 404
    message = "Not Found"
    constructor (message) { super(message); this.message = message || this.message; }
}

class MethodNotAllowed extends Error {
    code = 405
    message = "Method Not Allowed"
    constructor (message) { super(message); this.message = message || this.message; }
}

class NotAcceptable extends Error {
    code = 406
    message = "Not Acceptable"
    constructor (message) { super(message); this.message = message || this.message; }
}

class ProxyAuthenticationRequired extends Error {
    code = 407
    message = "Proxy Authentication Required"
    constructor (message) { super(message); this.message = message || this.message; }
}

class RequestTimeout extends Error {
    code = 408
    message = "Request Timeout"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Conflict extends Error {
    code = 409
    message = "Conflict"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Gone extends Error {
    code = 410
    message = "Gone"
    constructor (message) { super(message); this.message = message || this.message; }
}

class LengthRequired extends Error {
    code = 411
    message = "Length Required"
    constructor (message) { super(message); this.message = message || this.message; }
}

class PreconditionFailed extends Error {
    code = 412
    message = "Precondition Failed"
    constructor (message) { super(message); this.message = message || this.message; }
}

class PayloadTooLarge extends Error {
    code = 413
    message = "Payload Too Large"
    constructor (message) { super(message); this.message = message || this.message; }
}

class UriTooLong extends Error {
    code = 414
    message = "URI Too Long"
    constructor (message) { super(message); this.message = message || this.message; }
}

class UnsupportedMediaType extends Error {
    code = 415
    message = "Unsupported Media Type"
    constructor (message) { super(message); this.message = message || this.message; }
}

class RangeNotSatisfiable extends Error {
    code = 416
    message = "Range Not Satisfiable"
    constructor (message) { super(message); this.message = message || this.message; }
}

class ExpectationFailed extends Error {
    code = 417
    message = "Expectation Failed"
    constructor (message) { super(message); this.message = message || this.message; }
}

class ImATeapot extends Error {
    code = 418
    message = "I'm a Teapot"
    constructor (message) { super(message); this.message = message || this.message; }
}

class MisdirectedRequest extends Error {
    code = 421
    message = "Misdirected Request"
    constructor (message) { super(message); this.message = message || this.message; }
}

class UnprocessableEntity extends Error {
    code = 422
    message = "Unprocessable Entity"
    constructor (message) { super(message); this.message = message || this.message; }
}

class Locked extends Error {
    code = 423
    message = "Locked"
    constructor (message) { super(message); this.message = message || this.message; }
}

class FailedDependency extends Error {
    code = 424
    message = "Failed Dependency"
    constructor (message) { super(message); this.message = message || this.message; }
}

class UnorderedCollection extends Error {
    code = 425
    message = "Unordered Collection"
    constructor (message) { super(message); this.message = message || this.message; }
}

class UpgradeRequired extends Error {
    code = 426
    message = "Upgrade Required"
    constructor (message) { super(message); this.message = message || this.message; }
}

class PreconditionRequired extends Error {
    code = 428
    message = "Precondition Required"
    constructor (message) { super(message); this.message = message || this.message; }
}

class TooManyRequests extends Error {
    code = 429
    message = "Too Many Requests"
    constructor (message) { super(message); this.message = message || this.message; }
}

class RequestHeaderFieldsTooLarge extends Error {
    code = 431
    message = "Request Header Fields Too Large"
    constructor (message) { super(message); this.message = message || this.message; }
}

class UnavailableForLegalReasons extends Error {
    code = 451
    message = "Unavailable For Legal Reasons"
    constructor (message) { super(message); this.message = message || this.message; }
}

class InternalServerError extends Error {
    code = 500
    message = "Internal Server Error"
    constructor (message) { super(message); this.message = message || this.message; }
}

class NotImplemented extends Error {
    code = 501
    message = "Not Implemented"
    constructor (message) { super(message); this.message = message || this.message; }
}

class BadGateway extends Error {
    code = 502
    message = "Bad Gateway"
    constructor (message) { super(message); this.message = message || this.message; }
}

class ServiceUnavailable extends Error {
    code = 503
    message = "Service Unavailable"
    constructor (message) { super(message); this.message = message || this.message; }
}

class GatewayTimeout extends Error {
    code = 504
    message = "Gateway Timeout"
    constructor (message) { super(message); this.message = message || this.message; }
}

class HttpVersionNotSupported extends Error {
    code = 505
    message = "HTTP Version Not Supported"
    constructor (message) { super(message); this.message = message || this.message; }
}

class VariantAlsoNegotiates extends Error {
    code = 506
    message = "Variant Also Negotiates"
    constructor (message) { super(message); this.message = message || this.message; }
}

class InsufficientStorage extends Error {
    code = 507
    message = "Insufficient Storage"
    constructor (message) { super(message); this.message = message || this.message; }
}

class LoopDetected extends Error {
    code = 508
    message = "Loop Detected"
    constructor (message) { super(message); this.message = message || this.message; }
}

class BandwidthLimitExceeded extends Error {
    code = 509
    message = "Bandwidth Limit Exceeded"
    constructor (message) { super(message); this.message = message || this.message; }
}

class NotExtended extends Error {
    code = 510
    message = "Not Extended"
    constructor (message) { super(message); this.message = message || this.message; }
}

class NetworkAuthenticationRequired extends Error {
    code = 511
    message = "Network Authentication Required"
    constructor (message) { super(message); this.message = message || this.message; }
}

module.exports = {
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

}
