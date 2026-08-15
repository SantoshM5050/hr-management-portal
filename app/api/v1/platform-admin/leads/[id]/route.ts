import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await db.lead.findUnique({
      where: { id: params.id },
      include: {
        assignedToUser: { select: { id: true, fullName: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) {
      return apiError('Lead not found', 'NOT_FOUND', 404);
    }

    return apiSuccess(lead);
  } catch (err) {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { status, notes, followUpDate, assignedToUserId } = body;

    const existingLead = await db.lead.findUnique({ where: { id: params.id } });
    if (!existingLead) {
      return apiError('Lead not found', 'NOT_FOUND', 404);
    }

    const updates: any = {};
    const activitiesToCreate: any[] = [];

    if (status && status !== existingLead.status) {
      updates.status = status;
      activitiesToCreate.push({
        type: 'STATUS_CHANGE',
        description: `Lead status updated from ${existingLead.status} to ${status}`,
      });
    }

    if (notes !== undefined && notes !== existingLead.notes) {
      updates.notes = notes;
      activitiesToCreate.push({
        type: 'NOTE_ADDED',
        description: `Updated notes: "${notes}"`,
      });
    }

    if (followUpDate !== undefined) {
      updates.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }

    if (assignedToUserId !== undefined && assignedToUserId !== existingLead.assignedToUserId) {
      updates.assignedToUserId = assignedToUserId;
      activitiesToCreate.push({
        type: 'ASSIGNED',
        description: `Lead assignment updated`,
      });
    }

    const updatedLead = await db.lead.update({
      where: { id: params.id },
      data: {
        ...updates,
        activities: {
          create: activitiesToCreate,
        },
      },
      include: {
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    return apiSuccess(updatedLead);
  } catch (err) {
    console.error('PATCH lead error:', err);
    return apiError('Failed to update lead', 'INTERNAL_ERROR', 500);
  }
}
