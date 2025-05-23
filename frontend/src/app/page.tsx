import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheckIcon, 
  CloudIcon, 
  CpuChipIcon, 
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  TabletIcon,
  GlobeAltIcon,
  CheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Rentova
                </h1>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#security" className="text-gray-600 hover:text-gray-900 transition-colors">Security</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
              Enterprise-Grade Property Management
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                with AI Intelligence
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-12">
              SOC 2 Type II compliant platform with GDPR compliance, enterprise security, 
              and AI-powered automation. Available on all devices with real-time synchronization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/demo" 
                className="border border-gray-300 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Compatibility */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Works Everywhere You Do
            </h2>
            <p className="text-xl text-gray-600">
              Responsive design optimized for all devices and platforms
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <ComputerDesktopIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900">Desktop</h3>
              <p className="text-gray-600">Full-featured web app</p>
            </div>
            <div className="text-center">
              <TabletIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900">Tablet</h3>
              <p className="text-gray-600">Touch-optimized interface</p>
            </div>
            <div className="text-center">
              <DevicePhoneMobileIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900">Mobile</h3>
              <p className="text-gray-600">Native mobile apps</p>
            </div>
            <div className="text-center">
              <GlobeAltIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900">Web</h3>
              <p className="text-gray-600">Works in any browser</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section id="security" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Enterprise Security & Compliance
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Built for enterprises with the highest security standards and regulatory compliance requirements
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-12 w-12 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">SOC 2 Type II</h3>
                  <p className="text-green-600 font-semibold">Certified</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3" />
                  Security control framework
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3" />
                  Annual independent audits
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3" />
                  Continuous monitoring
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3" />
                  100% control coverage
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-12 w-12 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">GDPR Compliant</h3>
                  <p className="text-blue-600 font-semibold">EU Ready</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3" />
                  Data subject rights
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3" />
                  Right to be forgotten
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3" />
                  Data portability
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3" />
                  Consent management
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center mb-6">
                <CloudIcon className="h-12 w-12 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">Enterprise Security</h3>
                  <p className="text-purple-600 font-semibold">Bank-Grade</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-purple-600 mr-3" />
                  AES-256 encryption
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-purple-600 mr-3" />
                  Multi-factor authentication
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-purple-600 mr-3" />
                  Role-based access control
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckIcon className="h-5 w-5 text-purple-600 mr-3" />
                  99.9% uptime SLA
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Additional Security Features
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <ShieldCheckIcon className="h-8 w-8 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Disaster Recovery</h4>
                <p className="text-sm text-gray-600">4-hour RTO, 1-hour RPO</p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CloudIcon className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Daily Backups</h4>
                <p className="text-sm text-gray-600">Automated with encryption</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CpuChipIcon className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Audit Logging</h4>
                <p className="text-sm text-gray-600">Complete activity tracking</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Compliance Monitoring</h4>
                <p className="text-sm text-gray-600">Real-time compliance checks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Property Management
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Everything you need to manage properties efficiently with AI-powered automation
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
              <CpuChipIcon className="h-12 w-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Automation</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Smart tenant screening</li>
                <li>• Automated rent collection</li>
                <li>• Predictive maintenance</li>
                <li>• Intelligent chatbot support</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8">
              <ChartBarIcon className="h-12 w-12 text-purple-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Advanced Analytics</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Real-time dashboards</li>
                <li>• Financial reporting</li>
                <li>• Performance metrics</li>
                <li>• Predictive insights</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
              <CloudIcon className="h-12 w-12 text-green-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cloud-Native Architecture</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Microservices design</li>
                <li>• Auto-scaling infrastructure</li>
                <li>• Global CDN delivery</li>
                <li>• Multi-region deployment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modern UX Design */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Modern User Experience
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Built with the latest design patterns and performance optimizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Optimized performance with virtualized components</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Modern Design</h3>
              <p className="text-gray-600">Latest UI patterns with Tailwind CSS</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">♿</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Accessible</h3>
              <p className="text-gray-600">WCAG 2.1 AA compliant design</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🌙</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Dark Mode</h3>
              <p className="text-gray-600">System-aware theme switching</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Property Management?
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-blue-100 mb-8">
            Join thousands of property managers who trust Rentova for their business operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              Start Your Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/contact" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Rentova
              </h3>
              <p className="text-gray-400">
                Enterprise-grade property management with AI intelligence and security.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="/demo" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/status" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="/security" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Rentova. All rights reserved. SOC 2 Type II Certified | GDPR Compliant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}