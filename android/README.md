# Android APK Wrapper

This directory is reserved for the Android Studio wrapper project that will host the Next.js storefront in a WebView.

**Project documentation:** [../docs/README.md](../docs/README.md)

## Approach

- Create a new Android project in Android Studio.
- Use a single `WebView` activity to load the deployed or local Next.js storefront URL.
- Configure the Android manifest with the required Internet permission.
- Build a signed APK for distribution.

## Example steps

1. Open Android Studio and create a new `Empty Activity` project.
2. Add `<uses-permission android:name="android.permission.INTERNET" />` to `AndroidManifest.xml`.
3. In the activity layout, use `<WebView android:id="@+id/webView" ... />`.
4. Load the storefront URL using `webView.loadUrl("https://your-storefront-url")`.
