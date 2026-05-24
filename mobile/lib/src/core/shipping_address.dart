import '../features/auth/models.dart';

/// Builds `shipping_address` for `OrderCreateSchema` (matches web checkout).
String formatShippingAddress(UserProfile user) {
  final parts = <String>[
    if ((user.shippingAddressLine1 ?? '').trim().isNotEmpty)
      user.shippingAddressLine1!.trim(),
    if ((user.shippingAddressLine2 ?? '').trim().isNotEmpty)
      user.shippingAddressLine2!.trim(),
    if ((user.shippingLandmark ?? '').trim().isNotEmpty)
      user.shippingLandmark!.trim(),
  ];
  return parts.join(', ');
}

bool userHasDeliveryAddress(UserProfile user) {
  return formatShippingAddress(user).isNotEmpty &&
      (user.shippingRegion ?? '').trim().isNotEmpty &&
      (user.shippingCity ?? '').trim().isNotEmpty;
}
