import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';

import '../env.dart';
import '../auth/token_store.dart';
import 'api_exception.dart';
import 'v1_paths.dart';

typedef MaintenanceListener = void Function(String message);
typedef LogoutListener = void Function();

/// Single Dio instance used for every API call. Behaviour mirrors
/// `frontend/lib/api/client.ts`:
///
/// - `Authorization: Bearer <access>` injected for routes that need it.
/// - On `401`, attempt one silent refresh against `/auth/refresh` and replay.
/// - On `503` with `{ "maintenance": true, ... }`, notify the app so it can
///   show the dedicated maintenance screen and then surface the message.
class ApiClient {
  ApiClient({TokenStore? tokenStore, Dio? dio})
    : _tokenStore = tokenStore ?? TokenStore(),
      _dio = dio ?? Dio() {
    _dio.options
      ..baseUrl = AppEnv.apiBase
      ..connectTimeout = const Duration(seconds: 20)
      ..receiveTimeout = const Duration(seconds: 30)
      ..headers['Accept'] = 'application/json';
  }

  final Dio _dio;
  final TokenStore _tokenStore;

  Future<String?>? _refreshInflight;
  MaintenanceListener? onMaintenance;
  LogoutListener? onForcedLogout;

  Dio get raw => _dio;
  TokenStore get tokens => _tokenStore;

  /// Cancel in-flight refresh work after sign-out or before a new sign-in.
  void resetSession() {
    _refreshInflight = null;
  }

  // ─────────────────────── Public API ──────────────────────────────────────

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? query,
    bool auth = false,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'GET',
      path,
      queryParameters: query,
      auth: auth,
      extraHeaders: headers,
    );
  }

  Future<T> post<T>(
    String path, {
    Object? body,
    bool auth = false,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'POST',
      path,
      data: body,
      auth: auth,
      extraHeaders: headers,
    );
  }

  Future<T> put<T>(
    String path, {
    Object? body,
    bool auth = false,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'PUT',
      path,
      data: body,
      auth: auth,
      extraHeaders: headers,
    );
  }

  Future<T> patch<T>(
    String path, {
    Object? body,
    bool auth = false,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'PATCH',
      path,
      data: body,
      auth: auth,
      extraHeaders: headers,
    );
  }

  Future<T> delete<T>(
    String path, {
    Object? body,
    bool auth = false,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'DELETE',
      path,
      data: body,
      auth: auth,
      extraHeaders: headers,
    );
  }

  /// Wake a cold backend (Render free tier) by hitting `/health`. Failures are
  /// silent — same UX contract as the web `pingBackendHealth()`.
  Future<void> pingHealth() async {
    try {
      await Dio().getUri(
        Uri.parse('${AppEnv.backendOrigin}/health'),
        options: Options(receiveTimeout: const Duration(seconds: 5)),
      );
    } catch (_) {
      /* ignore */
    }
  }

  // ─────────────────────── Internals ───────────────────────────────────────

  Future<T> _request<T>(
    String method,
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    bool auth = false,
    Map<String, String>? extraHeaders,
  }) async {
    Future<Response<dynamic>> doFetch() async {
      final headers = <String, String>{...?extraHeaders};
      if (auth) {
        final stored = await _tokenStore.read();
        final token = stored.access;
        if (token == null || token.isEmpty) {
          throw ApiException(
            statusCode: 401,
            message: 'Not signed in',
            unauthorized: true,
          );
        }
        headers['Authorization'] = 'Bearer $token';
      }
      return _dio.request<dynamic>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: Options(
          method: method,
          headers: headers,
          responseType: ResponseType.json,
          validateStatus: (_) => true,
        ),
      );
    }

    Response<dynamic> res;
    try {
      res = await doFetch();
    } on DioException catch (e) {
      throw ApiException(
        statusCode: 0,
        message: e.message ?? 'Network error',
        networkFailure: true,
      );
    }

    if (res.statusCode == 401 && auth) {
      final refreshed = await _refreshAccessTokenOnce();
      if (refreshed != null) {
        res = await doFetch();
      }
    }

    final code = res.statusCode ?? 0;
    if (code >= 200 && code < 300) {
      return res.data as T;
    }

    final maintenance = _detectMaintenance(res);
    if (maintenance != null) {
      onMaintenance?.call(maintenance);
      throw ApiException(
        statusCode: code,
        message: maintenance,
        maintenance: true,
      );
    }

    final message = _friendlyMessage(code, res.data);
    if (code == 401 && auth) {
      onForcedLogout?.call();
      throw ApiException(
        statusCode: code,
        message: message,
        unauthorized: true,
      );
    }
    throw ApiException(statusCode: code, message: message);
  }

  Future<String?> _refreshAccessTokenOnce() {
    final inflight = _refreshInflight;
    if (inflight != null) return inflight;
    final completer = Completer<String?>();
    _refreshInflight = completer.future;

    () async {
      try {
        final stored = await _tokenStore.read();
        final refresh = stored.refresh;
        if (refresh == null || refresh.isEmpty) {
          completer.complete(null);
          return;
        }
        final res = await _dio.post<dynamic>(
          V1.authRefresh,
          data: {'refresh_token': refresh},
          options: Options(validateStatus: (_) => true),
        );
        if ((res.statusCode ?? 0) >= 400) {
          completer.complete(null);
          return;
        }
        final data = (res.data as Map?)?.cast<String, dynamic>();
        final newAccess = data?['access_token'] as String?;
        final newRefresh = (data?['refresh_token'] as String?) ?? refresh;
        if (newAccess == null) {
          completer.complete(null);
          return;
        }
        await _tokenStore.write(access: newAccess, refresh: newRefresh);
        completer.complete(newAccess);
      } catch (_) {
        completer.complete(null);
      } finally {
        _refreshInflight = null;
      }
    }();

    return completer.future;
  }

  String? _detectMaintenance(Response<dynamic> res) {
    if (res.statusCode != 503) return null;
    final body = res.data;
    Map<String, dynamic>? json;
    if (body is Map) {
      json = body.cast<String, dynamic>();
    } else if (body is String && body.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map) json = decoded.cast<String, dynamic>();
      } catch (_) {
        /* ignore */
      }
    }
    if (json == null || json['maintenance'] != true) return null;
    final msg = json['message'];
    return (msg is String && msg.trim().isNotEmpty)
        ? msg.trim()
        : 'Sikapa is undergoing scheduled maintenance.';
  }

  String _friendlyMessage(int status, Object? body) {
    String? extracted;
    Map<String, dynamic>? json;
    if (body is Map) {
      json = body.cast<String, dynamic>();
    } else if (body is String && body.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(body);
        if (decoded is Map) json = decoded.cast<String, dynamic>();
      } catch (_) {
        /* ignore */
      }
    }
    if (json != null) {
      final m = json['message'];
      if (m is String && m.trim().isNotEmpty) extracted = m.trim();
      final detail = json['detail'];
      if (extracted == null) {
        if (detail is String && detail.trim().isNotEmpty) {
          extracted = detail.trim();
        } else if (detail is List && detail.isNotEmpty) {
          final first = detail.first;
          if (first is Map && first['msg'] is String) {
            extracted = (first['msg'] as String).trim();
          }
        }
      }
    }
    if (extracted != null) return extracted;
    switch (status) {
      case 400:
        return 'That request could not be completed.';
      case 401:
        return 'Please sign in again.';
      case 403:
        return 'You do not have access to that.';
      case 404:
        return 'That was not found.';
      case 422:
        return 'Please check your input and try again.';
      case 429:
        return 'Too many attempts. Wait a moment and try again.';
      default:
        if (status >= 500) {
          return 'Something went wrong on our side. Try again shortly.';
        }
        return 'Something went wrong. Try again.';
    }
  }
}
