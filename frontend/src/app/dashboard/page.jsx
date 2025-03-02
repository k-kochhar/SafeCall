"use client";

import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  BellIcon, 
  XMarkIcon, 
  ArrowRightIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { 
  PhoneIcon, 
  ClockIcon, 
  ShieldCheckIcon, 
  UserIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';

const user = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}

const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Scheduled Calls', href: '#', current: false },
  { name: 'Safety Contacts', href: '#', current: false },
  { name: 'History', href: '#', current: false },
]

const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

const stats = [
  { name: 'Total Calls', stat: '12', icon: PhoneIcon },
  { name: 'Scheduled', stat: '3', icon: CalendarIcon },
  { name: 'Safety Score', stat: '98%', icon: ShieldCheckIcon },
]

const upcomingCalls = [
  { id: 1, caller: 'Boss', scenario: 'Work emergency', time: 'Today, 5:30 PM', urgency: 'Medium' },
  { id: 2, caller: 'Parent', scenario: 'Safety check', time: 'Tomorrow, 9:00 AM', urgency: 'Low' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-900">
      <Disclosure as="nav" className="bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800/80">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-9 w-9 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <PhoneIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-2.5">
                    <h1 className="text-xl font-bold bg-gradient-to-l from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">SafeCall</h1>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-zinc-800 text-white'
                              : 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
                            'rounded-md px-3 py-2 text-sm font-medium'
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-5 w-5 text-zinc-300" />
                    </button>

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="relative flex max-w-xs items-center rounded-full bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-800">
                          <span className="sr-only">Open user menu</span>
                          <img className="h-8 w-8 rounded-full" src={user.imageUrl} alt="" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-zinc-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {userNavigation.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <a
                                  href={item.href}
                                  className={classNames(
                                    active ? 'bg-zinc-700' : '',
                                    'block px-4 py-2 text-sm text-zinc-300'
                                  )}
                                >
                                  {item.name}
                                </a>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
                <div className="-mr-2 flex md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-800">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      item.current ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-700 hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              <div className="border-t border-zinc-700 pb-3 pt-4">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full" src={user.imageUrl} alt="" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user.name}</div>
                    <div className="text-sm font-medium text-zinc-400">{user.email}</div>
                  </div>
                  <button
                    type="button"
                    className="ml-auto flex-shrink-0 rounded-full bg-zinc-800 p-1 text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  {userNavigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-base font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <header className="bg-zinc-900 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {/* Stats section */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {stats.map((item) => (
              <div key={item.name} className="bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden rounded-lg shadow-xl border border-zinc-700/50 px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20 mr-4">
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <dt className="truncate text-sm font-medium text-zinc-400">{item.name}</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">{item.stat}</dd>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <button className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <PhoneIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-white">Emergency Call</span>
              <span className="text-xs text-zinc-400 mt-1">Immediate assistance</span>
            </button>
            
            <button className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:border-teal-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
              <div className="h-12 w-12 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-white">Schedule Call</span>
              <span className="text-xs text-zinc-400 mt-1">Plan ahead for safety</span>
            </button>

            <button className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
              <div className="h-12 w-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-white">Add Contact</span>
              <span className="text-xs text-zinc-400 mt-1">Manage safety contacts</span>
            </button>

            <button className="bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 group">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-white">Analytics</span>
              <span className="text-xs text-zinc-400 mt-1">View safety insights</span>
            </button>
          </div>

          {/* Upcoming Calls */}
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl shadow-xl border border-zinc-700/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 h-5 w-1 rounded-full mr-3"></span>
                Upcoming Calls
              </h2>
              <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center transition-colors">
                View all <ArrowRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            {upcomingCalls.length > 0 ? (
              <div className="overflow-hidden rounded-lg">
                <ul role="list" className="divide-y divide-zinc-700/50">
                  {upcomingCalls.map((call) => (
                    <li key={call.id} className="flex items-center justify-between gap-x-6 py-5 px-4 hover:bg-zinc-800/50 rounded-lg transition-colors">
                      <div className="flex min-w-0 gap-x-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full flex items-center justify-center">
                          <PhoneIcon className="h-6 w-6 text-cyan-400/70" />
                        </div>
                        <div className="min-w-0 flex-auto">
                          <p className="text-sm font-semibold leading-6 text-white">{call.caller}</p>
                          <p className="mt-1 truncate text-xs leading-5 text-zinc-400">{call.scenario}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm leading-6 text-white">{call.time}</p>
                        <div className="mt-1 flex items-center gap-x-1.5">
                          <div className="flex-none rounded-full bg-cyan-500/20 p-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                          </div>
                          <p className="text-xs leading-5 text-zinc-400">{call.urgency}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="h-16 w-16 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full flex items-center justify-center mb-4">
                  <ClockIcon className="h-8 w-8 text-cyan-400/50" />
                </div>
                <p className="text-zinc-300 font-medium">No upcoming calls</p>
                <p className="text-sm text-zinc-500 mt-1 text-center max-w-xs">Schedule a call to see it appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky bottom-0 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800/80 py-3 px-6 flex justify-around">
        <div className="flex flex-col items-center text-cyan-400">
          <PhoneIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Calls</span>
        </div>
        <div className="flex flex-col items-center text-zinc-500 hover:text-cyan-400 transition-colors">
          <ShieldCheckIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Safety</span>
        </div>
        <div className="flex flex-col items-center text-zinc-500 hover:text-cyan-400 transition-colors">
          <CogIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Settings</span>
        </div>
      </nav>
    </div>
  )
}
