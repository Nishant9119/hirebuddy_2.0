# Google Analytics Setup

This document explains the Google Analytics implementation in the Hirebuddy application.

## Overview

Google Analytics has been implemented using Google Analytics 4 (GA4) with the tracking ID `G-BZT6T4QE76`. The implementation includes:

- Automatic page view tracking
- Route change tracking for SPA navigation
- Utility functions for custom event tracking
- TypeScript support

## Implementation Details

### Files Modified/Created

1. **`pages/_app.tsx`** - Main Google Analytics setup
2. **`src/types/gtag.d.ts`** - TypeScript declarations for gtag
3. **`src/utils/analytics.ts`** - Utility functions for tracking
4. **`docs/google-analytics-setup.md`** - This documentation

### Features

#### Automatic Page View Tracking
- All page views are automatically tracked
- Route changes in the SPA are captured
- Uses Next.js Script component for optimal loading

#### Custom Event Tracking
The following utility functions are available for custom event tracking:

```typescript
import { 
  event, 
  trackSignUp, 
  trackJobApplication, 
  trackResumeDownload, 
  trackEmailCampaign 
} from '@/utils/analytics';

// Track custom events
event({
  action: 'button_click',
  category: 'engagement',
  label: 'signup_button',
  value: 1
});

// Track user sign ups
trackSignUp('google'); // or 'email', etc.

// Track job applications
trackJobApplication('Software Engineer', 'Google');

// Track resume downloads
trackResumeDownload('modern_template');

// Track email campaigns
trackEmailCampaign('cold_outreach');
```

## Usage Examples

### Tracking User Actions

```typescript
// In a component
import { trackJobApplication } from '@/utils/analytics';

const handleApply = () => {
  // Your application logic
  trackJobApplication(job.title, job.company);
};
```

### Tracking Form Submissions

```typescript
import { event } from '@/utils/analytics';

const handleFormSubmit = () => {
  event({
    action: 'form_submit',
    category: 'engagement',
    label: 'contact_form'
  });
};
```

### Tracking Premium Features

```typescript
import { event } from '@/utils/analytics';

const handlePremiumUpgrade = (plan: string) => {
  event({
    action: 'premium_upgrade',
    category: 'conversion',
    label: plan,
    value: 1
  });
};
```

## Configuration

The Google Analytics tracking ID is configured in `src/utils/analytics.ts`:

```typescript
export const GA_TRACKING_ID = 'G-BZT6T4QE76';
```

## Testing

To verify Google Analytics is working:

1. Open your browser's developer tools
2. Go to the Network tab
3. Navigate through your application
4. Look for requests to `googletagmanager.com`
5. Check the Google Analytics dashboard for real-time data

## Privacy Considerations

- Google Analytics respects user privacy settings
- No personally identifiable information is sent to Google
- Users can opt-out using browser extensions or privacy settings

## Troubleshooting

### Common Issues

1. **No data appearing in GA dashboard**
   - Check if the tracking ID is correct
   - Verify the script is loading (check Network tab)
   - Ensure no ad blockers are interfering

2. **TypeScript errors**
   - Make sure `src/types/gtag.d.ts` is included in your TypeScript configuration
   - Restart your development server

3. **Events not tracking**
   - Verify the gtag function is available: `typeof window !== 'undefined' && window.gtag`
   - Check browser console for errors

### Debug Mode

To enable debug mode, add this to your browser console:

```javascript
gtag('config', 'G-BZT6T4QE76', { debug_mode: true });
```

## Best Practices

1. **Use descriptive event names** - Make events easy to understand in reports
2. **Consistent categorization** - Use consistent category names across your app
3. **Avoid over-tracking** - Don't track every click, focus on meaningful interactions
4. **Test thoroughly** - Verify tracking works in different scenarios
5. **Document custom events** - Keep a list of all custom events for team reference

## Future Enhancements

Consider implementing:

- Enhanced ecommerce tracking for premium features
- User journey tracking
- A/B testing integration
- Custom dimensions for user segments
- Conversion funnel tracking
