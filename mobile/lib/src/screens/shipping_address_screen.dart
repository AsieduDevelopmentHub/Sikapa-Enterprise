import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../providers.dart';

/// Editable form for the saved shipping address that the FastAPI backend
/// stores on the user's profile. The web app shipped with the same fields
/// (see `frontend/app/account/addresses/page.tsx`); replicating them here
/// unblocks new mobile-only users from completing checkout without needing
/// to bounce out to the website first.
class ShippingAddressScreen extends ConsumerStatefulWidget {
  const ShippingAddressScreen({super.key});

  @override
  ConsumerState<ShippingAddressScreen> createState() =>
      _ShippingAddressScreenState();
}

class _ShippingAddressScreenState extends ConsumerState<ShippingAddressScreen> {
  final _form = GlobalKey<FormState>();
  final _contactName = TextEditingController();
  final _contactPhone = TextEditingController();
  final _region = TextEditingController();
  final _city = TextEditingController();
  final _line1 = TextEditingController();
  final _line2 = TextEditingController();
  final _landmark = TextEditingController();

  bool _busy = false;
  String? _error;
  bool _populated = false;

  @override
  void dispose() {
    _contactName.dispose();
    _contactPhone.dispose();
    _region.dispose();
    _city.dispose();
    _line1.dispose();
    _line2.dispose();
    _landmark.dispose();
    super.dispose();
  }

  void _populateFromProfile() {
    if (_populated) return;
    final user = ref.read(authProvider).user;
    if (user == null) return;
    _contactName.text = user.shippingContactName ?? user.name;
    _contactPhone.text = user.shippingContactPhone ?? user.phone ?? '';
    _region.text = user.shippingRegion ?? '';
    _city.text = user.shippingCity ?? '';
    _line1.text = user.shippingAddressLine1 ?? '';
    _line2.text = user.shippingAddressLine2 ?? '';
    _landmark.text = user.shippingLandmark ?? '';
    _populated = true;
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final body = <String, dynamic>{
        'shipping_contact_name': _contactName.text.trim(),
        'shipping_contact_phone': _contactPhone.text.trim(),
        'shipping_region': _region.text.trim(),
        'shipping_city': _city.text.trim(),
        'shipping_address_line1': _line1.text.trim(),
        // Send empty strings explicitly so previously-set values can be
        // cleared. The backend treats blank/optional strings as null.
        'shipping_address_line2': _line2.text.trim(),
        'shipping_landmark': _landmark.text.trim(),
      };
      await ref.read(authServiceProvider).updateProfile(body);
      await ref.read(authProvider.notifier).refreshProfile();
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Shipping address saved.')));
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/account');
      }
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
    final auth = ref.watch(authProvider);
    if (!auth.isSignedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Shipping address')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.lock_outline,
                  size: 56,
                  color: SikapaColors.textMuted,
                ),
                const SizedBox(height: 12),
                const Text('Sign in to manage your shipping address.'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.push('/login'),
                  child: const Text('Sign in'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    _populateFromProfile();

    return Scaffold(
      appBar: AppBar(title: const Text('Shipping address')),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'Where should we deliver?',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 6),
              Text(
                'This address is reused for every order. You can update it any time.',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: SikapaColors.textMuted),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _contactName,
                decoration: const InputDecoration(labelText: 'Recipient name'),
                textInputAction: TextInputAction.next,
                validator: (v) => (v ?? '').trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _contactPhone,
                decoration: const InputDecoration(labelText: 'Phone number'),
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                validator: (v) =>
                    (v ?? '').trim().length < 7 ? 'Enter a valid phone' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _region,
                decoration: const InputDecoration(
                  labelText: 'Region / State',
                  hintText: 'e.g. Greater Accra',
                ),
                textInputAction: TextInputAction.next,
                validator: (v) => (v ?? '').trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _city,
                decoration: const InputDecoration(labelText: 'City / Town'),
                textInputAction: TextInputAction.next,
                validator: (v) => (v ?? '').trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _line1,
                decoration: const InputDecoration(
                  labelText: 'Street address',
                  hintText: 'House number and street name',
                ),
                textInputAction: TextInputAction.next,
                validator: (v) => (v ?? '').trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _line2,
                decoration: const InputDecoration(
                  labelText: 'Apartment / Suite (optional)',
                ),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _landmark,
                decoration: const InputDecoration(
                  labelText: 'Nearby landmark (optional)',
                  hintText: 'Helps the courier find you',
                ),
                textInputAction: TextInputAction.done,
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: Color(0xFF991B1B)),
                  ),
                ),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _busy ? null : _save,
                child: _busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Save address'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
