import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Status pill aligned with web order status colors.
class OrderStatusChip extends StatelessWidget {
  const OrderStatusChip({super.key, required this.status, this.paymentStatus});

  final String status;
  final String? paymentStatus;

  @override
  Widget build(BuildContext context) {
    final label = _label();
    final colors = _colors();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: colors.foreground,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _label() {
    final s = status.toLowerCase();
    final pay = (paymentStatus ?? '').toLowerCase();
    if (pay == 'pending' || pay == 'unpaid') return 'Awaiting payment';
    if (s == 'pending') return 'Processing';
    if (s == 'confirmed') return 'Confirmed';
    if (s == 'shipped') return 'Shipped';
    if (s == 'delivered') return 'Delivered';
    if (s == 'cancelled') return 'Cancelled';
    return status;
  }

  _ChipColors _colors() {
    final s = status.toLowerCase();
    final pay = (paymentStatus ?? '').toLowerCase();
    if (pay == 'pending' || pay == 'unpaid') {
      return const _ChipColors(
        background: Color(0xFFFFF4E5),
        border: SikapaColors.gold,
        foreground: SikapaColors.textPrimary,
      );
    }
    if (s == 'delivered') {
      return const _ChipColors(
        background: Color(0xFFE8F5E9),
        border: Color(0xFF81C784),
        foreground: Color(0xFF2E7D32),
      );
    }
    if (s == 'cancelled') {
      return const _ChipColors(
        background: Color(0xFFFFEBEE),
        border: SikapaColors.crimson,
        foreground: SikapaColors.crimson,
      );
    }
    return const _ChipColors(
      background: SikapaColors.graySoft,
      border: SikapaColors.graySoft,
      foreground: SikapaColors.textMuted,
    );
  }
}

class _ChipColors {
  const _ChipColors({
    required this.background,
    required this.border,
    required this.foreground,
  });

  final Color background;
  final Color border;
  final Color foreground;
}

bool orderNeedsPayment(String? paymentStatus) {
  final pay = (paymentStatus ?? '').toLowerCase();
  return pay == 'pending' || pay == 'unpaid' || pay.isEmpty;
}
