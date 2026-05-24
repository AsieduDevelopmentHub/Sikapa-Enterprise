class TokenResponse {
  TokenResponse({
    required this.accessToken,
    this.refreshToken,
    this.tokenType = 'bearer',
    this.expiresIn = 0,
  });

  final String accessToken;
  final String? refreshToken;
  final String tokenType;
  final int expiresIn;

  factory TokenResponse.fromJson(Map<String, dynamic> json) {
    return TokenResponse(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String?,
      tokenType: (json['token_type'] as String?) ?? 'bearer',
      expiresIn: (json['expires_in'] as num?)?.toInt() ?? 0,
    );
  }
}

class TwoFASetupResponse {
  TwoFASetupResponse({
    required this.secret,
    required this.qrCode,
    required this.backupCodes,
  });

  final String secret;
  final String qrCode;
  final List<String> backupCodes;

  factory TwoFASetupResponse.fromJson(Map<String, dynamic> json) {
    final codes = json['backup_codes'];
    return TwoFASetupResponse(
      secret: json['secret'] as String? ?? '',
      qrCode: json['qr_code'] as String? ?? '',
      backupCodes: codes is List
          ? codes.map((e) => '$e').toList()
          : const <String>[],
    );
  }
}

class UserProfile {
  UserProfile({
    required this.id,
    required this.username,
    required this.name,
    this.email,
    this.phone,
    this.shippingRegion,
    this.shippingCity,
    this.shippingAddressLine1,
    this.shippingAddressLine2,
    this.shippingLandmark,
    this.shippingContactName,
    this.shippingContactPhone,
    this.emailVerified = false,
    this.twoFaEnabled = false,
    this.isAdmin = false,
  });

  final int id;
  final String username;
  final String name;
  final String? email;
  final String? phone;
  final String? shippingRegion;
  final String? shippingCity;
  final String? shippingAddressLine1;
  final String? shippingAddressLine2;
  final String? shippingLandmark;
  final String? shippingContactName;
  final String? shippingContactPhone;
  final bool emailVerified;
  final bool twoFaEnabled;
  final bool isAdmin;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: (json['id'] as num).toInt(),
      username: json['username'] as String,
      name: json['name'] as String? ?? json['username'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      shippingRegion: json['shipping_region'] as String?,
      shippingCity: json['shipping_city'] as String?,
      shippingAddressLine1: json['shipping_address_line1'] as String?,
      shippingAddressLine2: json['shipping_address_line2'] as String?,
      shippingLandmark: json['shipping_landmark'] as String?,
      shippingContactName: json['shipping_contact_name'] as String?,
      shippingContactPhone: json['shipping_contact_phone'] as String?,
      emailVerified: json['email_verified'] as bool? ?? false,
      twoFaEnabled: json['two_fa_enabled'] as bool? ?? false,
      isAdmin: json['is_admin'] as bool? ?? false,
    );
  }
}
