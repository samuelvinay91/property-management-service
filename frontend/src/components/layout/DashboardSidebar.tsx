'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  UserGroupIcon,
  TruckIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useUI } from '@/components/providers/UIProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { UserRole } from '@/types';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['all'] },
  { name: 'Properties', href: '/dashboard/properties', icon: BuildingOfficeIcon, roles: ['all'] },
  { name: 'Bookings', href: '/dashboard/bookings', icon: CalendarDaysIcon, roles: ['all'] },
  { name: 'Maintenance', href: '/dashboard/maintenance', icon: WrenchScrewdriverIcon, roles: ['all'] },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCardIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER] },
  { name: 'Tenants', href: '/dashboard/tenants', icon: UserGroupIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
  { name: 'Vendors', href: '/dashboard/vendors', icon: TruckIcon, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER] },
  { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon, roles: ['all'] },
  { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon, roles: ['all'] },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon, roles: ['all'] },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, isMobile } = useUI();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter((item) => {
    if (item.roles.includes('all')) return true;
    return user?.role && item.roles.includes(user.role);
  });

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center px-4">
        <Link href="/dashboard" className="flex items-center">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
            P
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
            PropFlow
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
              )}
              onClick={() => {
                if (isMobile) {
                  setSidebarOpen(false);
                }
              }}
            >
              <item.icon
                className={classNames(
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300',
                  'mr-3 h-6 w-6 flex-shrink-0'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen && isMobile} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-0 pb-2">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div
        className={classNames(
          'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}