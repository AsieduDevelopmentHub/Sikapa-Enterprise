import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../core/api/api_exception.dart';
import '../core/theme.dart';
import '../providers.dart';

/// Sentinel return URL the WebView listens for. The Paystack-hosted page
/// redirects here on completion. We don't actually serve this URL — the
/// WebView intercepts the navigation, extracts the `?reference=`, then closes.
const String _paystackReturnHost = 'sikapa-mobile.local';
const String _paystackReturnUrl =
    'https://$_paystackReturnHost/checkout-complete';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  bool _busy = false;
  String? _error;

  Future<void> _placeOrderAndPay() async {
    final auth = ref.read(authProvider);
    final cart = ref.read(cartProvider).value;
    if (auth.user == null || cart == null || cart.items.isEmpty) return;

    final user = auth.user!;
    if ((user.shippingAddressLine1 ?? '').trim().isEmpty ||
        (user.shippingRegion ?? '').trim().isEmpty ||
        (user.shippingCity ?? '').trim().isEmpty) {
      setState(
        () => _error = 'Add a shipping address before placing this order.',
      );
      if (mounted) context.push('/account/shipping-address');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final orders = ref.read(ordersServiceProvider);
      final order = await orders.create({
        'shipping_region': user.shippingRegion,
        'shipping_city': user.shippingCity,
        'shipping_address_line1': user.shippingAddressLine1,
        if ((user.shippingAddressLine2 ?? '').isNotEmpty)
          'shipping_address_line2': user.shippingAddressLine2,
        if ((user.shippingLandmark ?? '').isNotEmpty)
          'shipping_landmark': user.shippingLandmark,
        'shipping_contact_name': user.shippingContactName ?? user.name,
        'shipping_contact_phone': user.shippingContactPhone ?? user.phone ?? '',
      });
      final authorizationUrl = await orders.initiatePaystack(
        orderId: order.id,
        callbackUrl: _paystackReturnUrl,
      );

      if (!mounted) return;
      final reference = await Navigator.of(context).push<String?>(
        MaterialPageRoute(
          builder: (_) => _PaystackWebView(authorizationUrl: authorizationUrl),
        ),
      );

      if (reference != null && reference.isNotEmpty) {
        try {
          await orders.verifyPaystack(reference);
        } catch (_) {
          /* server webhook will reconcile */
        }
      }
      ref.invalidate(ordersProvider);
      ref.invalidate(cartProvider);
      if (mounted) context.go('/orders');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartAsync = ref.watch(cartProvider);
    final auth = ref.watch(authProvider);
    final fmt = NumberFormat.simpleCurrency(name: 'GHS', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: cartAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (cart) {
          if (cart.items.isEmpty) {
            return const Center(child: Text('Your cart is empty.'));
          }
          final user = auth.user;
          final hasAddress =
              user != null &&
              (user.shippingAddressLine1 ?? '').trim().isNotEmpty &&
              (user.shippingRegion ?? '').trim().isNotEmpty &&
              (user.shippingCity ?? '').trim().isNotEmpty;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Ship to',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  if (user != null)
                    TextButton(
                      onPressed: () =>
                          context.push('/account/shipping-address'),
                      child: Text(hasAddress ? 'Edit' : 'Add'),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: SikapaColors.graySoft),
                ),
                child: user == null
                    ? const Text('Sign in to continue.')
                    : !hasAddress
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'No shipping address saved yet.',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Add an address so we know where to deliver this order.',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: SikapaColors.textMuted),
                          ),
                          const SizedBox(height: 10),
                          FilledButton(
                            onPressed: () =>
                                context.push('/account/shipping-address'),
                            child: const Text('Add address'),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.shippingContactName ?? user.name,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          if ((user.shippingAddressLine1 ?? '').isNotEmpty)
                            Text(user.shippingAddressLine1!),
                          if ((user.shippingAddressLine2 ?? '').isNotEmpty)
                            Text(user.shippingAddressLine2!),
                          Text(
                            '${user.shippingCity ?? ''}, ${user.shippingRegion ?? ''}',
                          ),
                          if ((user.shippingContactPhone ?? '').isNotEmpty)
                            Text(user.shippingContactPhone!),
                        ],
                      ),
              ),
              const SizedBox(height: 24),
              Text(
                'Order summary',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              ...cart.items.map(
                (l) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${l.product?.name ?? '#${l.productId}'} × ${l.quantity}',
                        ),
                      ),
                      Text(fmt.format(l.lineTotal)),
                    ],
                  ),
                ),
              ),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Subtotal'),
                  Text(
                    fmt.format(cart.subtotal),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Shipping is added by the server based on your region.',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: SikapaColors.textMuted),
              ),
              if (_error != null)
                Container(
                  margin: const EdgeInsets.only(top: 12),
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
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _busy || !hasAddress ? null : _placeOrderAndPay,
                icon: const Icon(Icons.lock_outline),
                label: _busy
                    ? const Text('Processing...')
                    : Text(
                        hasAddress
                            ? 'Place order & pay'
                            : 'Add address to continue',
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _PaystackWebView extends StatefulWidget {
  const _PaystackWebView({required this.authorizationUrl});
  final String authorizationUrl;

  @override
  State<_PaystackWebView> createState() => _PaystackWebViewState();
}

class _PaystackWebViewState extends State<_PaystackWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (req) {
            final uri = Uri.tryParse(req.url);
            if (uri != null && uri.host == _paystackReturnHost) {
              final ref =
                  uri.queryParameters['reference'] ??
                  uri.queryParameters['trxref'];
              Navigator.of(context).pop(ref);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authorizationUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pay with Paystack'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(null),
        ),
      ),
      body: WebViewWidget(controller: _controller),
    );
  }
}
