This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Backend Integration

> **Important**: Oscar App uses **Oscar Web's backend** for all API operations.
> Both apps share the **same Supabase project** for data synchronization.

## Key Architecture

- **API Backend**: Oscar Web (https://oscar.samyarth.org)
- **Database**: Shared Supabase Project
- **Authentication**: Supabase Auth (shared across both apps)
- **Payments**: Razorpay (configured for subscriptions)
- **Usage Tracking**: Centralized in Supabase

## Before Starting

Ensure you have:
1. Oscar Web backend running/accessible
2. Same Supabase credentials as Oscar Web
3. Razorpay API keys configured (see `.env.example`)

See `BACKEND_INTEGRATION.ts` for detailed architecture documentation.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Configure Environment Variables

Copy `.env.example` to `.env` and fill in your actual credentials:

```sh
cp .env.example .env
```

Then update these values with your actual credentials:

- **Razorpay Keys**: Get from your Razorpay Dashboard (https://dashboard.razorpay.com/)
- **Supabase Keys**: Get from your Supabase Dashboard (https://app.supabase.com/)
- **Webhook Secret**: Generate in Razorpay Dashboard under Webhooks section

## Step 4: Set Up Razorpay

### Create Razorpay Plans

The app expects two subscription plans to be created in Razorpay:

1. **Monthly Plan** (₹99/month)
   - Period: monthly
   - Description: "Oscar Pro Monthly"

2. **Yearly Plan** (₹999/year)
   - Period: yearly
   - Description: "Oscar Pro Yearly"

Get the plan IDs from Razorpay Dashboard and update `src/constants/index.ts` if needed.

### Set Up Webhook

In Razorpay Dashboard:
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
3. Subscribe to events:
   - `subscription.activated`
   - `subscription.paused`
   - `subscription.halted`
   - `subscription.cancelled`
   - `subscription.completed`
   - `subscription.expired`
4. Copy the Webhook Secret and add to `.env` as `RAZORPAY_WEBHOOK_SECRET`

## Step 5: Initialize Database

Run the migration to create the necessary tables:

```sh
# Using Supabase CLI
supabase migration up

# Or execute the SQL directly in Supabase SQL Editor:
# See: supabase/migrations/001_subscriptions.sql
```

## Architecture Overview

### Subscription System

The app implements a complete subscription and usage tracking system:

- **Free Plan**: 5 recordings/month, 10 notes, 5 vocabulary terms
- **Pro Plan**: Unlimited everything

### Key Components

- **SubscriptionContext**: Global subscription state management
- **UsageIndicator**: Display user's current usage
- **PricingPage**: Allow users to upgrade plans
- **BillingPage**: Manage active subscriptions
- **Razorpay Integration**: Handle payment processing

### API Endpoints

- `POST /api/razorpay/create-subscription`: Create a new subscription
- `POST /api/razorpay/verify`: Verify payment signature
- `POST /api/razorpay/webhook`: Handle Razorpay webhooks
- `POST /api/razorpay/cancel`: Cancel active subscription
- `GET /api/usage/stats`: Get user's usage statistics
- `POST /api/usage/increment`: Increment recording count

### Data Flow

1. User navigates to Pricing page
2. Selects monthly or yearly plan
3. `useRazorpayCheckout` hook creates subscription via API
4. Razorpay checkout opens
5. User completes payment
6. Webhook received and processed
7. Subscription status updated in database
8. User gains access to Pro features

## Testing with Razorpay

Use Razorpay test credentials (not real):
- Test Key ID and Secret from Dashboard
- Test cards: Use 4111111111111111 with any future expiry

The app automatically uses test mode with test credentials.

## Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

### Webhook not being triggered
- Ensure webhook URL is publicly accessible
- Check webhook secret is correct in `.env`
- Verify events are subscribed in Razorpay Dashboard

### Usage tracking not working
- Ensure `incrementUsage` is called after recording
- Check `/api/usage/increment` endpoint returns 200
- Verify Supabase authentication is working

### Subscription not showing as active
- Check webhook payload in Razorpay Dashboard
- Verify subscription ID is saved in database
- Check database migration was applied

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
