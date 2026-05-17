import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../providers.dart';

/// Args passed from `LoginScreen` when the backend reports that an account
/// requires a TOTP code. We re-use the identifier + password the user just
/// typed so they don't have to re-enter them, and then call
/// `POST /auth/login-2fa` with the 6-digit code.
class Login2faArgs {
  const Login2faArgs({required this.identifier, required this.password});
  final String identifier;
  final String password;
}

class Login2faScreen extends ConsumerStatefulWidget {
  const Login2faScreen({super.key, required this.args});
  final Login2faArgs args;

  @override
  ConsumerState<Login2faScreen> createState() => _Login2faScreenState();
}

class _Login2faScreenState extends ConsumerState<Login2faScreen> {
  final _codeCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final code = _codeCtrl.text.trim();
    if (code.length < 6) {
      setState(() => _error = 'Enter the 6-digit code from your authenticator app.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authProvider.notifier)
          .loginWith2fa(widget.args.identifier, widget.args.password, code);
      if (mounted) context.go('/');
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Two-step verification')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text('Enter your code',
                style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 6),
            Text(
              'Open your authenticator app and enter the 6-digit code for ${widget.args.identifier}.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: SikapaColors.textMuted,
                  ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _codeCtrl,
              autofocus: true,
              keyboardType: TextInputType.number,
              maxLength: 6,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(letterSpacing: 6, fontSize: 22),
              textAlign: TextAlign.center,
              decoration: const InputDecoration(
                labelText: 'Authenticator code',
                counterText: '',
              ),
              onSubmitted: (_) => _submit(),
            ),
            if (_error != null)
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_error!,
                    style: const TextStyle(color: Color(0xFF991B1B))),
              ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Verify & sign in'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: _busy ? null : () => context.pop(),
              child: const Text('Back to sign in'),
            ),
          ],
        ),
      ),
    );
  }
}
