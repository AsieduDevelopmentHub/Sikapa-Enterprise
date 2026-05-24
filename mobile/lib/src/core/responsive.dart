import 'package:flutter/material.dart';

/// Layout helpers for phones vs tablets (large screens).
class SikapaLayout {
  static const double tabletBreakpoint = 600;
  static const double wideBreakpoint = 900;
  static const double maxContentWidth = 840;

  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= tabletBreakpoint;

  static int productGridColumns(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= wideBreakpoint) return 4;
    if (w >= tabletBreakpoint) return 3;
    return 2;
  }

  static double productGridAspectRatio(BuildContext context) =>
      isTablet(context) ? 0.72 : 0.62;
}

/// Centers shell content on tablets with a readable max width.
class ResponsiveContent extends StatelessWidget {
  const ResponsiveContent({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          maxWidth: SikapaLayout.maxContentWidth,
        ),
        child: child,
      ),
    );
  }
}
