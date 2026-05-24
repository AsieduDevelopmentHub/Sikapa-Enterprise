import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Mirrors web `ThemeContext` (`light` | `dark` | `system`).
enum ThemePreference { light, dark, system }

const _storageKey = 'sikapa_theme';

class ThemePreferenceController extends StateNotifier<ThemePreference> {
  ThemePreferenceController() : super(ThemePreference.system) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == 'light') state = ThemePreference.light;
    if (raw == 'dark') state = ThemePreference.dark;
    if (raw == 'system') state = ThemePreference.system;
  }

  Future<void> set(ThemePreference value) async {
    state = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, value.name);
  }
}

final themePreferenceProvider =
    StateNotifierProvider<ThemePreferenceController, ThemePreference>(
      (ref) => ThemePreferenceController(),
    );

final themeModeProvider = Provider<ThemeMode>((ref) {
  final pref = ref.watch(themePreferenceProvider);
  switch (pref) {
    case ThemePreference.light:
      return ThemeMode.light;
    case ThemePreference.dark:
      return ThemeMode.dark;
    case ThemePreference.system:
      return ThemeMode.system;
  }
});
