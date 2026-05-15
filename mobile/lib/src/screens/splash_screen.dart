import 'package:flutter/material.dart';

import '../core/theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SikapaColors.bgDeep,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [SikapaColors.gold, Color(0xFFE6CB95)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: SikapaColors.gold.withValues(alpha: 0.55),
                    blurRadius: 24,
                  ),
                ],
              ),
              child: const Center(
                child: Text(
                  'S',
                  style: TextStyle(
                    fontSize: 44,
                    fontWeight: FontWeight.w700,
                    color: SikapaColors.crimson,
                    fontFamily: 'serif',
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Sikapa',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 16),
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                color: SikapaColors.gold,
                strokeWidth: 2.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
