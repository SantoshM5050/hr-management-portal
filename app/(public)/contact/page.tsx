import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="info">Get in Touch</Badge>
        <h1 className="text-4xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          Contact Our SaaS Team
        </h1>
        <p className="text-base text-surface-600 dark:text-surface-400">
          Have questions about enterprise deployment, multi-tenant security, or custom organization requirements? We are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <Mail className="w-6 h-6 text-brand-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-surface-100">Email Us</h4>
                <p className="text-sm text-surface-500 mt-1">support@universal-hrms.com</p>
                <p className="text-sm text-surface-500">sales@universal-hrms.com</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <Phone className="w-6 h-6 text-brand-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-surface-100">Call Us</h4>
                <p className="text-sm text-surface-500 mt-1">+1 (800) 555-0199</p>
                <p className="text-xs text-surface-400">Mon - Fri, 9am - 6pm EST</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <MapPin className="w-6 h-6 text-brand-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-surface-100">Global Headquarters</h4>
                <p className="text-sm text-surface-500 mt-1">100 SaaS Plaza, Suite 800</p>
                <p className="text-sm text-surface-500">San Francisco, CA 94105</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Send Us a Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Your Name" placeholder="John Doe" />
              <Input label="Your Email" type="email" placeholder="john@company.com" />
            </div>
            <Input label="Subject" placeholder="Inquiry regarding organization setup" />
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                Message
              </label>
              <textarea
                rows={4}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-brand-500"
                placeholder="How can we assist you?"
              />
            </div>
            <Button variant="primary" size="lg" className="w-full sm:w-auto">Send Message</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
