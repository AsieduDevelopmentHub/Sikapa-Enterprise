import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Brand palette mirrored from `frontend/tailwind.config.js`.
class SikapaColors {
  const SikapaColors._();

  static const Color crimson = Color(0xFF941A20);
  static const Color crimsonDark = Color(0xFF7A1419);
  static const Color bgDeep = Color(0xFF3B2A25);
  static const Color gold = Color(0xFFC8A96A);
  static const Color goldHover = Color(0xFFA8894F);
  static const Color cream = Color(0xFFF7F4F1);
  static const Color graySoft = Color(0xFFEDEDED);
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF6B6B6B);
  static const Color textMuted = Color(0xFFA0A0A0);
  static const Color heroSubtext = Color(0xFFF1EDE9);
  static const Color zinc950 = Color(0xFF09090B);
  static const Color zinc900 = Color(0xFF18181B);
  static const Color zinc800 = Color(0xFF27272A);
}

class SikapaTheme {
  const SikapaTheme._();

  static TextTheme _textTheme(Color body, Color heading) {
    final serif = GoogleFonts.cormorantGaramond;
    final sans = GoogleFonts.dmSans;
    return TextTheme(
      displayLarge: serif(
        fontSize: 36,
        height: 1.12,
        color: heading,
        fontWeight: FontWeight.w600,
      ),
      displayMedium: serif(
        fontSize: 32,
        height: 1.15,
        color: heading,
        fontWeight: FontWeight.w600,
      ),
      headlineLarge: serif(
        fontSize: 22,
        height: 1.3,
        color: heading,
        fontWeight: FontWeight.w600,
      ),
      headlineMedium: serif(
        fontSize: 20,
        height: 1.35,
        color: heading,
        fontWeight: FontWeight.w600,
      ),
      titleLarge: sans(
        fontSize: 18,
        height: 1.4,
        color: heading,
        fontWeight: FontWeight.w600,
      ),
      titleMedium: sans(
        fontSize: 16,
        height: 1.4,
        color: heading,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: sans(fontSize: 16, height: 1.5, color: body),
      bodyMedium: sans(fontSize: 14, height: 1.45, color: body),
      bodySmall: sans(fontSize: 12, height: 1.4, color: body),
      labelLarge: sans(
        fontSize: 14,
        height: 1.2,
        color: body,
        fontWeight: FontWeight.w600,
      ),
      labelMedium: sans(
        fontSize: 12,
        height: 1.2,
        color: body,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  static ThemeData light() {
    final scheme = const ColorScheme.light().copyWith(
      primary: SikapaColors.crimson,
      onPrimary: Colors.white,
      secondary: SikapaColors.gold,
      onSecondary: SikapaColors.crimsonDark,
      surface: Colors.white,
      onSurface: SikapaColors.textPrimary,
      surfaceTint: Colors.transparent,
      error: const Color(0xFFB91C1C),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: SikapaColors.cream,
      brightness: Brightness.light,
      textTheme: _textTheme(SikapaColors.textPrimary, SikapaColors.textPrimary),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: SikapaColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleTextStyle: GoogleFonts.cormorantGaramond(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: SikapaColors.textPrimary,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: SikapaColors.gold,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: SikapaColors.crimson,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: SikapaColors.textPrimary,
          side: const BorderSide(color: SikapaColors.graySoft),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: SikapaColors.graySoft),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: SikapaColors.graySoft),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: SikapaColors.gold, width: 1.5),
        ),
        labelStyle: GoogleFonts.dmSans(
          color: SikapaColors.textSecondary,
          fontSize: 14,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0x14000000)),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: SikapaColors.graySoft,
        thickness: 1,
        space: 1,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: SikapaColors.gold,
        unselectedItemColor: SikapaColors.textMuted,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: SikapaColors.bgDeep,
        contentTextStyle: GoogleFonts.dmSans(color: Colors.white, fontSize: 14),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  /// Dark palette aligned with web `dark:` Tailwind classes (zinc-950 surfaces).
  static ThemeData dark() {
    const body = Color(0xFFE4E4E7);
    const heading = Color(0xFFF4F4F5);
    final scheme = const ColorScheme.dark().copyWith(
      primary: SikapaColors.gold,
      onPrimary: SikapaColors.zinc950,
      secondary: SikapaColors.gold,
      onSecondary: heading,
      surface: SikapaColors.zinc900,
      onSurface: heading,
      surfaceContainerHighest: SikapaColors.zinc800,
      surfaceTint: Colors.transparent,
      error: const Color(0xFFF87171),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: SikapaColors.zinc950,
      brightness: Brightness.dark,
      textTheme: _textTheme(body, heading),
      appBarTheme: AppBarTheme(
        backgroundColor: SikapaColors.zinc900,
        foregroundColor: heading,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleTextStyle: GoogleFonts.cormorantGaramond(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: heading,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: SikapaColors.gold,
          foregroundColor: SikapaColors.zinc950,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: SikapaColors.crimson,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: heading,
          side: const BorderSide(color: SikapaColors.zinc800),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: SikapaColors.zinc900,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: SikapaColors.zinc800),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: SikapaColors.zinc800),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: SikapaColors.gold, width: 1.5),
        ),
        labelStyle: GoogleFonts.dmSans(
          color: SikapaColors.textMuted,
          fontSize: 14,
        ),
      ),
      cardTheme: CardThemeData(
        color: SikapaColors.zinc900,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0x1AFFFFFF)),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: SikapaColors.zinc800,
        thickness: 1,
        space: 1,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: SikapaColors.zinc900,
        selectedItemColor: SikapaColors.gold,
        unselectedItemColor: SikapaColors.textMuted,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: SikapaColors.zinc800,
        contentTextStyle: GoogleFonts.dmSans(color: heading, fontSize: 14),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
