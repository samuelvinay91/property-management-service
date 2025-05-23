'use client';

import { useState } from 'react';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  KeyIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';

interface Setting {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  value: any;
  options?: { label: string; value: string }[];
}

const systemSettings: Setting[] = [
  // General Settings
  {
    id: 'platform_name',
    category: 'General',
    name: 'Platform Name',
    description: 'The name of your property management platform',
    type: 'text',
    value: 'PropFlow',
  },
  {
    id: 'platform_url',
    category: 'General',
    name: 'Platform URL',
    description: 'The base URL for your platform',
    type: 'text',
    value: 'https://propflow.example.com',
  },
  {
    id: 'support_email',
    category: 'General',
    name: 'Support Email',
    description: 'Email address for customer support',
    type: 'text',
    value: 'support@propflow.example.com',
  },
  {
    id: 'timezone',
    category: 'General',
    name: 'Default Timezone',
    description: 'Default timezone for the platform',
    type: 'select',
    value: 'UTC',
    options: [
      { label: 'UTC', value: 'UTC' },
      { label: 'EST (UTC-5)', value: 'America/New_York' },
      { label: 'PST (UTC-8)', value: 'America/Los_Angeles' },
      { label: 'CST (UTC-6)', value: 'America/Chicago' },
    ],
  },
  
  // Notification Settings
  {
    id: 'email_notifications',
    category: 'Notifications',
    name: 'Email Notifications',
    description: 'Enable email notifications for users',
    type: 'boolean',
    value: true,
  },
  {
    id: 'sms_notifications',
    category: 'Notifications',
    name: 'SMS Notifications',
    description: 'Enable SMS notifications for users',
    type: 'boolean',
    value: false,
  },
  {
    id: 'push_notifications',
    category: 'Notifications',
    name: 'Push Notifications',
    description: 'Enable push notifications for mobile app',
    type: 'boolean',
    value: true,
  },
  {
    id: 'notification_frequency',
    category: 'Notifications',
    name: 'Notification Frequency',
    description: 'How often to send digest notifications',
    type: 'select',
    value: 'daily',
    options: [
      { label: 'Real-time', value: 'realtime' },
      { label: 'Hourly', value: 'hourly' },
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
    ],
  },
  
  // Security Settings
  {
    id: 'password_min_length',
    category: 'Security',
    name: 'Minimum Password Length',
    description: 'Minimum number of characters required for passwords',
    type: 'number',
    value: 8,
  },
  {
    id: 'require_2fa',
    category: 'Security',
    name: 'Require Two-Factor Authentication',
    description: 'Force all users to enable 2FA',
    type: 'boolean',
    value: false,
  },
  {
    id: 'session_timeout',
    category: 'Security',
    name: 'Session Timeout (minutes)',
    description: 'How long user sessions remain active',
    type: 'number',
    value: 60,
  },
  {
    id: 'login_attempts',
    category: 'Security',
    name: 'Max Login Attempts',
    description: 'Maximum failed login attempts before account lockout',
    type: 'number',
    value: 5,
  },
  
  // Payment Settings
  {
    id: 'payment_processing',
    category: 'Payments',
    name: 'Payment Processing',
    description: 'Enable online payment processing',
    type: 'boolean',
    value: true,
  },
  {
    id: 'late_fee_percentage',
    category: 'Payments',
    name: 'Late Fee Percentage',
    description: 'Percentage charged for late payments',
    type: 'number',
    value: 5,
  },
  {
    id: 'payment_grace_period',
    category: 'Payments',
    name: 'Payment Grace Period (days)',
    description: 'Days after due date before late fees apply',
    type: 'number',
    value: 5,
  },
  {
    id: 'accepted_payment_methods',
    category: 'Payments',
    name: 'Accepted Payment Methods',
    description: 'Which payment methods to accept',
    type: 'select',
    value: 'all',
    options: [
      { label: 'All Methods', value: 'all' },
      { label: 'Credit/Debit Cards Only', value: 'cards' },
      { label: 'Bank Transfer Only', value: 'bank' },
      { label: 'Cards + Bank Transfer', value: 'cards_bank' },
    ],
  },
  
  // Maintenance Settings
  {
    id: 'auto_assign_maintenance',
    category: 'Maintenance',
    name: 'Auto-assign Maintenance',
    description: 'Automatically assign maintenance requests to vendors',
    type: 'boolean',
    value: false,
  },
  {
    id: 'maintenance_response_time',
    category: 'Maintenance',
    name: 'Required Response Time (hours)',
    description: 'Maximum time to respond to maintenance requests',
    type: 'number',
    value: 24,
  },
];

const categories = [
  { id: 'General', name: 'General', icon: CogIcon },
  { id: 'Notifications', name: 'Notifications', icon: BellIcon },
  { id: 'Security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'Payments', name: 'Payments', icon: CurrencyDollarIcon },
  { id: 'Maintenance', name: 'Maintenance', icon: KeyIcon },
];

export default function SystemSettings() {
  const [settings, setSettings] = useState<Setting[]>(systemSettings);
  const [activeCategory, setActiveCategory] = useState('General');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredSettings = settings.filter(setting => setting.category === activeCategory);

  const handleSettingChange = (settingId: string, newValue: any) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, value: newValue }
          : setting
      )
    );
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasChanges(false);
    setIsSaving(false);
  };

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, parseInt(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      
      case 'boolean':
        return (
          <div className="mt-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={setting.value}
                onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {setting.value ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        );
      
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {setting.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your property management platform</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
              <nav className="space-y-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {category.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Settings Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {categories.find(c => c.id === activeCategory)?.name} Settings
                  </h2>
                  {hasChanges && (
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </div>

              {/* Settings List */}
              <div className="p-6">
                <div className="space-y-6">
                  {filteredSettings.map(setting => (
                    <div key={setting.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {setting.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {setting.description}
                          </p>
                        </div>
                        <div className="lg:col-span-2">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Export Settings
                </button>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                  Import Settings
                </button>
                <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
                  Reset to Defaults
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  Test Email Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}