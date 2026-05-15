/// Thrown by the API client for non-2xx responses. Wrap with rich context so
/// UI can show a friendly message without re-parsing JSON everywhere.
class ApiException implements Exception {
  ApiException({
    required this.statusCode,
    required this.message,
    this.maintenance = false,
    this.unauthorized = false,
    this.networkFailure = false,
  });

  final int statusCode;
  final String message;
  final bool maintenance;
  final bool unauthorized;
  final bool networkFailure;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
