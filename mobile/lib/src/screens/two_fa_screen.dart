import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api/api_exception.dart';
import '../features/auth/models.dart';
import '../providers.dart';

class TwoFaScreen extends ConsumerStatefulWidget {
  const TwoFaScreen({super.key});

  @override
  ConsumerState<TwoFaScreen> createState() => _TwoFaScreenState();
}

class _TwoFaScreenState extends ConsumerState<TwoFaScreen> {
  TwoFASetupResponse? _setup;
  final _codeCtrl = TextEditingController();
  final _disablePwCtrl = TextEditingController();
  bool _busy = false;
  String? _message;
  List<String> _backupCodes = const [];

  @override
  void dispose() {
    _codeCtrl.dispose();
    _disablePwCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSetup() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final setup = await ref.read(authServiceProvider).setup2fa();
      setState(() {
        _setup = setup;
        _backupCodes = setup.backupCodes;
      });
    } on ApiException catch (e) {
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _enable() async {
    final setup = _setup;
    if (setup == null) return;
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await ref
          .read(authServiceProvider)
          .enable2fa(
            secret: setup.secret,
            backupCodes: _backupCodes,
            verificationCode: _codeCtrl.text.trim(),
          );
      await ref.read(authProvider.notifier).refreshProfile();
      setState(() => _message = 'Two-factor authentication is now enabled.');
    } on ApiException catch (e) {
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _disable() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await ref.read(authServiceProvider).disable2fa(_disablePwCtrl.text);
      await ref.read(authProvider.notifier).refreshProfile();
      setState(() {
        _setup = null;
        _message = 'Two-factor authentication disabled.';
      });
    } on ApiException catch (e) {
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final enabled = user?.twoFaEnabled ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Two-factor authentication')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (enabled) ...[
              const Text(
                '2FA is enabled on your account. Enter your password to turn it off.',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _disablePwCtrl,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _busy ? null : _disable,
                child: const Text('Disable 2FA'),
              ),
            ] else ...[
              const Text(
                'Scan the QR code with Google Authenticator (or similar), then enter a code to confirm.',
              ),
              const SizedBox(height: 16),
              if (_setup == null)
                OutlinedButton(
                  onPressed: _busy ? null : _loadSetup,
                  child: const Text('Generate QR code'),
                )
              else ...[
                Center(child: _QrImage(base64Data: _setup!.qrCode)),
                const SizedBox(height: 8),
                Text(
                  'Secret: ${_setup!.secret}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (_backupCodes.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Save these backup codes:',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  ..._backupCodes.map((c) => Text(c)),
                ],
                const SizedBox(height: 12),
                TextField(
                  controller: _codeCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Authenticator code',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _busy ? null : _enable,
                  child: const Text('Enable 2FA'),
                ),
              ],
            ],
            if (_message != null) ...[
              const SizedBox(height: 16),
              Text(_message!),
            ],
          ],
        ),
      ),
    );
  }
}

class _QrImage extends StatelessWidget {
  const _QrImage({required this.base64Data});
  final String base64Data;

  @override
  Widget build(BuildContext context) {
    try {
      var raw = base64Data.trim();
      if (raw.contains(',')) raw = raw.split(',').last;
      final bytes = base64Decode(raw);
      return Image.memory(bytes, height: 200, fit: BoxFit.contain);
    } catch (_) {
      return const Text('Could not display QR code.');
    }
  }
}
