import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../providers.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key, this.initialEmail, this.initialCode});

  final String? initialEmail;
  final String? initialCode;

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _emailCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  bool _busy = false;
  String? _message;
  bool _success = false;

  @override
  void initState() {
    super.initState();
    final email = widget.initialEmail?.trim();
    if (email != null && email.isNotEmpty) _emailCtrl.text = email;
    final code = widget.initialCode?.trim();
    if (code != null && code.isNotEmpty) _codeCtrl.text = code;
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() {
      _busy = true;
      _message = null;
      _success = false;
    });
    try {
      await ref
          .read(authServiceProvider)
          .verifyEmail(
            email: _emailCtrl.text.trim(),
            code: _codeCtrl.text.trim(),
          );
      await ref.read(authProvider.notifier).refreshProfile();
      setState(() {
        _success = true;
        _message = 'Email verified successfully.';
      });
    } on ApiException catch (e) {
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resend() async {
    if (!ref.read(authProvider).isSignedIn) {
      setState(() => _message = 'Sign in to resend a verification code.');
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(authServiceProvider).resendEmailVerification();
      setState(() => _message = 'Verification code sent to your email.');
    } on ApiException catch (e) {
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = ref.watch(authProvider).isSignedIn;
    final userEmail = ref.watch(authProvider).user?.email;
    if (_emailCtrl.text.isEmpty && userEmail != null && userEmail.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _emailCtrl.text.isEmpty) {
          _emailCtrl.text = userEmail;
        }
      });
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Verify email')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Enter the code from your email',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailCtrl,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _codeCtrl,
              decoration: const InputDecoration(labelText: 'Verification code'),
              keyboardType: TextInputType.number,
            ),
            if (_message != null) ...[
              const SizedBox(height: 12),
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
              onPressed: _busy ? null : _verify,
              child: const Text('Verify'),
            ),
            if (signedIn) ...[
              const SizedBox(height: 12),
              TextButton(
                onPressed: _busy ? null : _resend,
                child: const Text('Resend code'),
              ),
            ],
            if (_success) ...[
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => context.go('/account'),
                child: const Text('Back to account'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
