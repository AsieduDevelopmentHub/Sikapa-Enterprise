import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../providers.dart';

class PasswordResetConfirmScreen extends ConsumerStatefulWidget {
  const PasswordResetConfirmScreen({super.key, this.initialToken});

  final String? initialToken;

  @override
  ConsumerState<PasswordResetConfirmScreen> createState() =>
      _PasswordResetConfirmScreenState();
}

class _PasswordResetConfirmScreenState
    extends ConsumerState<PasswordResetConfirmScreen> {
  final _tokenCtrl = TextEditingController();
  final _pwCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _busy = false;
  String? _message;
  bool _success = false;

  @override
  void initState() {
    super.initState();
    final t = widget.initialToken?.trim();
    if (t != null && t.isNotEmpty) _tokenCtrl.text = t;
  }

  @override
  void dispose() {
    _tokenCtrl.dispose();
    _pwCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final token = _tokenCtrl.text.trim();
    final pw = _pwCtrl.text;
    if (token.isEmpty) {
      setState(() => _message = 'Paste the reset token from your email.');
      return;
    }
    if (pw.length < 8) {
      setState(() => _message = 'Password must be at least 8 characters.');
      return;
    }
    if (pw != _confirmCtrl.text) {
      setState(() => _message = 'Passwords do not match.');
      return;
    }
    setState(() {
      _busy = true;
      _message = null;
      _success = false;
    });
    try {
      await ref.read(authServiceProvider).confirmPasswordReset(token, pw);
      setState(() {
        _success = true;
        _message = 'Password reset. You can sign in with your new password.';
      });
    } on ApiException catch (e) {
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Set new password')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Reset your password',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Open the link in your email on this device, or paste the token below.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: SikapaColors.textMuted),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _tokenCtrl,
              decoration: const InputDecoration(labelText: 'Reset token'),
              autocorrect: false,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _pwCtrl,
              decoration: const InputDecoration(labelText: 'New password'),
              obscureText: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _confirmCtrl,
              decoration: const InputDecoration(labelText: 'Confirm password'),
              obscureText: true,
            ),
            if (_message != null) ...[
              const SizedBox(height: 16),
              Text(
                _message!,
                style: TextStyle(
                  color: _success
                      ? const Color(0xFF2E7D32)
                      : SikapaColors.crimson,
                ),
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Reset password'),
            ),
            if (_success) ...[
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => context.go('/login'),
                child: const Text('Go to sign in'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
