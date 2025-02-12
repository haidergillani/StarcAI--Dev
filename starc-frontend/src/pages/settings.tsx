import { type AppType } from "next/dist/shared/lib/utils";
import { useState } from 'react';
import Menu from "./components/Menu";
import { withAuth } from "../components/withAuth";
import { useSettings } from "../contexts/SettingsContext";

interface SettingOption {
  id: string;
  label: string;
  value: string | boolean | number;
  type: 'select';
  options?: { value: string; label: string }[];
}

const SettingsPage: AppType = () => {
  const [activeTab, setActiveTab] = useState('display');
  const { settings, updateSettings } = useSettings();

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
        activeTab === id
          ? 'bg-indigo-800 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      {label}
    </button>
  );

  const SettingSection = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{description}</p>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );

  const SelectOption = ({ option, value, onChange }: { option: SettingOption; value: string; onChange: (value: string) => void }) => (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium text-gray-800 dark:text-gray-200">{option.label}</h4>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {option.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Menu />
      <div className="ml-64 p-8">
        <h1 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">Settings</h1>
        
        <div className="flex space-x-4 mb-8">
          <TabButton id="display" label="Display" />
          <TabButton id="editor" label="Editor" />
          <TabButton id="notifications" label="Notifications" />
          <TabButton id="ai" label="AI Preferences" />
        </div>

        <div className="space-y-8">
          {activeTab === 'display' && (
            <SettingSection
              title="Display Settings"
              description="Customize how the application looks and feels"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <SelectOption
                  option={{
                    id: 'theme',
                    label: 'Theme',
                    type: 'select',
                    value: settings.theme,
                    options: [
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' }
                    ]
                  }}
                  value={settings.theme}
                  onChange={(value) => updateSettings({ theme: value as 'light' | 'dark' })}
                />
                <SelectOption
                  option={{
                    id: 'fontSize',
                    label: 'Font Size',
                    type: 'select',
                    value: settings.fontSize,
                    options: [
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' }
                    ]
                  }}
                  value={settings.fontSize}
                  onChange={(value) => updateSettings({ fontSize: value as 'small' | 'medium' | 'large' })}
                />
              </div>
            </SettingSection>
          )}

          {activeTab === 'editor' && (
            <SettingSection
              title="Editor Settings"
              description="Configure your writing experience"
            >
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">🚧 Editor customization features are under development.</p>
              </div>
            </SettingSection>
          )}

          {activeTab === 'notifications' && (
            <SettingSection
              title="Notification Settings"
              description="Manage your email notifications"
            >
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">🚧 Email notifications are under development.</p>
              </div>
            </SettingSection>
          )}

          {activeTab === 'ai' && (
            <SettingSection
              title="AI Preferences"
              description="Customize your AI rewrite experience"
            >
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">🚧 AI customization features are under development.</p>
              </div>
            </SettingSection>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(SettingsPage); 