class ShippingCityOption {
  ShippingCityOption({required this.name, required this.fee});

  final String name;
  final double fee;

  factory ShippingCityOption.fromJson(Map<String, dynamic> json) =>
      ShippingCityOption(
        name: json['name'] as String,
        fee: (json['fee'] as num?)?.toDouble() ?? 0,
      );
}

class ShippingRegionOption {
  ShippingRegionOption({
    required this.slug,
    required this.label,
    required this.baseFee,
    this.cities = const [],
  });

  final String slug;
  final String label;
  final double baseFee;
  final List<ShippingCityOption> cities;

  factory ShippingRegionOption.fromJson(Map<String, dynamic> json) =>
      ShippingRegionOption(
        slug: json['slug'] as String,
        label: json['label'] as String,
        baseFee: (json['base_fee'] as num?)?.toDouble() ?? 0,
        cities: (json['cities'] as List? ?? const [])
            .whereType<Map>()
            .map((e) => ShippingCityOption.fromJson(e.cast<String, dynamic>()))
            .toList(),
      );
}

class ShippingCourierOption {
  ShippingCourierOption({required this.name, required this.feeDelta});

  final String name;
  final double feeDelta;

  factory ShippingCourierOption.fromJson(Map<String, dynamic> json) =>
      ShippingCourierOption(
        name: json['name'] as String,
        feeDelta: (json['fee_delta'] as num?)?.toDouble() ?? 0,
      );
}

class ShippingOptions {
  ShippingOptions({this.regions = const [], this.couriers = const []});

  final List<ShippingRegionOption> regions;
  final List<ShippingCourierOption> couriers;

  factory ShippingOptions.fromJson(Map<String, dynamic> json) => ShippingOptions(
    regions: (json['regions'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => ShippingRegionOption.fromJson(e.cast<String, dynamic>()))
        .toList(),
    couriers: (json['couriers'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => ShippingCourierOption.fromJson(e.cast<String, dynamic>()))
        .toList(),
  );
}
