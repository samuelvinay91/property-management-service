'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUI } from '@/components/providers/UIProvider';
import { SearchCommand } from '@/components/ui/SearchCommand';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { toggleSidebar, theme, setTheme, isMobile } = useUI();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const themeOptions = [
    { name: 'Light', value: 'light', icon: SunIcon },
    { name: 'Dark', value: 'dark', icon: MoonIcon },
    { name: 'System', value: 'system', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
      <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none dark:bg-gray-900 dark:border-gray-700">
        {/* Sidebar toggle */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          type="button"
          className="hidden lg:block -m-2.5 p-2.5 text-gray-700 dark:text-gray-200"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Toggle sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          {/* Search */}
          <div className="relative flex flex-1">
            <SearchCommand />
          </div>

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notifications */}
            <NotificationDropdown />

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700" aria-hidden="true" />

            {/* Theme selector */}
            <Menu as="div" className="relative">
              <Menu.Button className="-m-1.5 flex items-center p-1.5 text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white">
                <span className="sr-only">Change theme</span>
                {theme === 'light' && <SunIcon className="h-6 w-6" aria-hidden="true" />}
                {theme === 'dark' && <MoonIcon className="h-6 w-6" aria-hidden="true" />}
                {theme === 'system' && <ComputerDesktopIcon className="h-6 w-6" aria-hidden="true" />}
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
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                  {themeOptions.map((option) => (
                    <Menu.Item key={option.value}>
                      {({ active }) => (
                        <button
                          onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                          className={classNames(
                            active ? 'bg-gray-50 dark:bg-gray-700' : '',
                            'flex w-full items-center px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100'
                          )}
                        >
                          <option.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                          {option.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="-m-1.5 flex items-center p-1.5">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-white" aria-hidden="true">
                    {user?.firstName} {user?.lastName}
                  </span>
                </span>
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
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push('/dashboard/profile')}
                        className={classNames(
                          active ? 'bg-gray-50 dark:bg-gray-700' : '',
                          'flex w-full items-center px-3 py-2 text-sm text-gray-900 dark:text-gray-100'
                        )}
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Your profile
                      </button>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push('/dashboard/settings')}
                        className={classNames(
                          active ? 'bg-gray-50 dark:bg-gray-700' : '',
                          'flex w-full items-center px-3 py-2 text-sm text-gray-900 dark:text-gray-100'
                        )}
                      >
                        <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Settings
                      </button>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={classNames(
                          active ? 'bg-gray-50 dark:bg-gray-700' : '',
                          'flex w-full items-center px-3 py-2 text-sm text-gray-900 dark:text-gray-100'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
}