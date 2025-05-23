'use client';

import { useState } from 'react';
import { ChevronDownIcon, LanguageIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useI18n } from '@/lib/i18n/hooks/useI18n';
import { localeConfig, type Locale } from '@/lib/i18n/config';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ 
  className = '', 
  showLabel = true,
  variant = 'default' 
}: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocaleConfig = localeConfig[locale];
  const sortedLocales = Object.entries(localeConfig).sort(([, a], [, b]) => 
    a.name.localeCompare(b.name)
  );

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <Menu as="div" className={`relative inline-block text-left ${className}`}>
        <Menu.Button className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          <LanguageIcon className="h-5 w-5 text-gray-600" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {sortedLocales.map(([localeKey, config]) => (
                <Menu.Item key={localeKey}>
                  {({ active }) => (
                    <button
                      onClick={() => handleLocaleChange(localeKey as Locale)}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } ${
                        locale === localeKey ? 'text-blue-600' : 'text-gray-900'
                      } group flex w-full items-center px-4 py-2 text-sm transition-colors`}
                      dir={config.direction}
                    >
                      <span className="mr-3 text-lg">{config.flag}</span>
                      <span className="flex-1 text-left">{config.name}</span>
                      {locale === localeKey && (
                        <CheckIcon className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  }

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <Menu.Button className="inline-flex w-full justify-between items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <div className="flex items-center">
          <span className="mr-3 text-lg">{currentLocaleConfig.flag}</span>
          {showLabel && (
            <span className="truncate">{currentLocaleConfig.name}</span>
          )}
        </div>
        <ChevronDownIcon className="ml-2 h-5 w-5" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {sortedLocales.map(([localeKey, config]) => (
              <Menu.Item key={localeKey}>
                {({ active }) => (
                  <button
                    onClick={() => handleLocaleChange(localeKey as Locale)}
                    className={`${
                      active ? 'bg-gray-50' : ''
                    } ${
                      locale === localeKey ? 'text-blue-600 bg-blue-50' : 'text-gray-900'
                    } group flex w-full items-center px-4 py-2 text-sm transition-colors`}
                    dir={config.direction}
                  >
                    <span className="mr-3 text-lg">{config.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{config.name}</div>
                      <div className="text-xs text-gray-500">{config.nativeName}</div>
                    </div>
                    {locale === localeKey && (
                      <CheckIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}