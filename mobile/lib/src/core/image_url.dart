import 'env.dart';

const String _placeholder =
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop';

const Set<String> _bogusTokens = {
  'string',
  'null',
  'none',
  'undefined',
  'n/a',
  'na',
  'url',
};

bool _looksLikePlausibleRelative(String t) {
  if (t.isEmpty) return false;
  if (_bogusTokens.contains(t.toLowerCase())) return false;
  if (t.contains('/')) return true;
  return RegExp(r'\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|#|$)', caseSensitive: false)
      .hasMatch(t);
}

bool _absoluteUrlLooksInvalid(String trimmed) {
  Uri? u;
  try {
    u = Uri.parse(trimmed);
  } catch (_) {
    return true;
  }
  final segments = u.pathSegments.where((s) => s.isNotEmpty).toList();
  final leaf = segments.isEmpty ? '' : segments.last;
  if (leaf.isEmpty) return false;
  final base = leaf.split('?').first;
  return _bogusTokens.contains(base.toLowerCase());
}

/// Mirrors `frontend/lib/api/products.ts#resolveImageUrl`. Relative paths get
/// the API origin prefixed; junk values fall back to a stock placeholder.
String resolveImageUrl(String? raw) {
  final t = (raw ?? '').trim();
  if (t.isEmpty) return _placeholder;
  if (t.startsWith('http://') || t.startsWith('https://')) {
    if (_absoluteUrlLooksInvalid(t)) return _placeholder;
    return t;
  }
  if (!_looksLikePlausibleRelative(t)) return _placeholder;
  final origin = AppEnv.backendOrigin;
  return t.startsWith('/') ? '$origin$t' : '$origin/$t';
}
