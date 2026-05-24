import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/theme.dart';
import '../providers.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isSignedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Account')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.account_circle_outlined,
                  size: 56,
                  color: SikapaColors.textMuted,
                ),
                const SizedBox(height: 12),
                Text(
                  'Welcome to Sikapa',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                const Text(
                  'Sign in to track orders, save items, and check out faster.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    OutlinedButton(
                      onPressed: () => context.push('/register'),
                      child: const Text('Create account'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton(
                      onPressed: () => context.push('/login'),
                      child: const Text('Sign in'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    }

    final user = auth.user!;
    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          ListTile(
            leading: const CircleAvatar(
              backgroundColor: SikapaColors.gold,
              foregroundColor: Colors.white,
              child: Icon(Icons.person),
            ),
            title: Text(
              user.name,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            subtitle: Text(
              user.email ?? user.username,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          if (!user.emailVerified)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF4E5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: SikapaColors.gold),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('Verify your email to unlock all features.'),
                  ),
                  TextButton(
                    onPressed: () => context.push('/verify-email'),
                    child: const Text('Verify'),
                  ),
                ],
              ),
            ),
          const Divider(),
          _Tile(
            icon: Icons.edit_outlined,
            title: 'Edit profile',
            onTap: () => context.push('/account/profile'),
          ),
          _Tile(
            icon: Icons.receipt_long_outlined,
            title: 'My orders',
            onTap: () => context.push('/orders'),
          ),
          _Tile(
            icon: Icons.assignment_return_outlined,
            title: 'Returns & refunds',
            onTap: () => context.push('/returns'),
          ),
          _Tile(
            icon: Icons.local_shipping_outlined,
            title: 'Shipping address',
            onTap: () => context.push('/account/shipping-address'),
          ),
          _Tile(
            icon: Icons.favorite_outline,
            title: 'Wishlist',
            onTap: () => context.go('/wishlist'),
          ),
          _Tile(
            icon: Icons.lock_outline,
            title: 'Change password',
            onTap: () => context.push('/account/change-password'),
          ),
          _Tile(
            icon: Icons.security_outlined,
            title: user.twoFaEnabled
                ? 'Two-factor authentication (on)'
                : 'Two-factor authentication',
            onTap: () => context.push('/account/two-fa'),
          ),
          if (!user.emailVerified)
            _Tile(
              icon: Icons.mark_email_unread_outlined,
              title: 'Verify email',
              onTap: () => context.push('/verify-email'),
            ),
          _Tile(
            icon: Icons.help_outline,
            title: 'Help & support',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Help center available on the web for now.'),
                ),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: SikapaColors.crimson),
            title: const Text(
              'Sign out',
              style: TextStyle(
                color: SikapaColors.crimson,
                fontWeight: FontWeight.w600,
              ),
            ),
            onTap: () async {
              await ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.title, required this.onTap});
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: SikapaColors.textPrimary),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right, color: SikapaColors.textMuted),
      onTap: onTap,
    );
  }
}
