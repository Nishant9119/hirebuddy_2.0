// Google Analytics utility functions

export const GA_TRACKING_ID = 'G-BZT6T4QE76';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user sign ups
export const trackSignUp = (method: string) => {
  event({
    action: 'sign_up',
    category: 'engagement',
    label: method,
  });
};

// Track job applications
export const trackJobApplication = (jobTitle: string, company: string) => {
  event({
    action: 'job_application',
    category: 'engagement',
    label: `${jobTitle} at ${company}`,
  });
};

// Track resume downloads
export const trackResumeDownload = (template: string) => {
  event({
    action: 'resume_download',
    category: 'engagement',
    label: template,
  });
};

// Track email campaigns
export const trackEmailCampaign = (campaignType: string) => {
  event({
    action: 'email_campaign',
    category: 'engagement',
    label: campaignType,
  });
};
