import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      orgName,
      orgTypeCode,
      peopleCount,
      country,
      preferredDate,
      preferredTime,
      modulesOfInterest,
      message,
      consent,
    } = body;

    // Server-side validations
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return apiError('Full Name is required', 'VALIDATION_ERROR', 422, [{ field: 'fullName', message: 'Full Name is required' }]);
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return apiError('Valid work email is required', 'VALIDATION_ERROR', 422, [{ field: 'email', message: 'Valid work email is required' }]);
    }

    if (!orgName || typeof orgName !== 'string' || orgName.trim().length === 0) {
      return apiError('Organization Name is required', 'VALIDATION_ERROR', 422, [{ field: 'orgName', message: 'Organization Name is required' }]);
    }

    if (!consent) {
      return apiError('You must agree to the privacy policy to request a demo', 'VALIDATION_ERROR', 422, [{ field: 'consent', message: 'Consent is required' }]);
    }

    // Check for duplicate pending demo request in past 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingLead = await db.lead.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        createdAt: { gte: oneDayAgo },
      },
    });

    if (existingLead) {
      return apiSuccess(
        {
          leadId: existingLead.id,
          status: existingLead.status,
          isDuplicate: true,
          message: 'We have already received a demo request for this email address recently. Our team will contact you shortly.',
        },
        200
      );
    }

    // Create Lead record in PostgreSQL
    const lead = await db.lead.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        orgName: orgName.trim(),
        orgTypeCode: orgTypeCode || 'COMPANY',
        peopleCount: peopleCount || '1-50',
        country: country || 'United States',
        preferredDate: preferredDate || null,
        preferredTime: preferredTime || null,
        modulesOfInterest: modulesOfInterest || ['CORE', 'ATTENDANCE', 'LEAVE'],
        message: message ? message.trim() : null,
        status: 'NEW',
        activities: {
          create: {
            type: 'CREATED',
            description: `Public demo request submitted by ${fullName.trim()} for ${orgName.trim()} (${orgTypeCode || 'COMPANY'})`,
          },
        },
      },
    });

    return apiSuccess(
      {
        leadId: lead.id,
        status: lead.status,
        message: 'Thank you! Your demo request has been received. A SaaS consultant will reach out to you within 24 hours.',
      },
      201
    );
  } catch (err) {
    console.error('Demo request API error:', err);
    return apiError('An unexpected error occurred while processing your request.', 'INTERNAL_ERROR', 500);
  }
}
