export interface NotificationPreferences {
  id: number;
  user_id: number;
  order_status_updates: boolean;
  promotional_emails: boolean;
  newsletter_emails: boolean;
  security_alerts: boolean;
  product_recommendations: boolean;
  inventory_alerts: boolean;
  price_drop_alerts: boolean;
  review_reminders: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesResponse {
  data: NotificationPreferences;
}

export interface UpdateNotificationPreferencesRequest {
  order_status_updates: boolean;
  promotional_emails: boolean;
  newsletter_emails: boolean;
  security_alerts: boolean;
  product_recommendations: boolean;
  inventory_alerts: boolean;
  price_drop_alerts: boolean;
  review_reminders: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}
