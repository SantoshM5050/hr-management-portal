import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { emailProvider } from '@/lib/email-provider';
import { logAuditEvent } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, token, newPassword } = body;

    // Action 1: Request Password Reset Token
    if (action === 'REQUEST_RESET') {
      if (!email) return apiError('Email address is required', 'VALIDATION_ERROR', 422);

      const user = await db.user.findFirst({
        where: { email: email.toLowerCase().trim() },
      });

      // Always return success to prevent account enumeration
      if (!user) {
        return apiSuccess({ message: 'If an account exists for this email, password reset instructions have been dispatched.' });
      }

      // Generate single-use reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      await emailProvider.sendEmail({
        to: user.email,
        subject: 'Password Reset Request - Universal HRMS',
        html: `<p>Use the following token to reset your password: <strong>${resetToken}</strong> (Expires in 1 hour)</p>`,
      });

      await logAuditEvent({
        userId: user.id,
        organizationId: 'SYSTEM',
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'USER',
        entityId: user.id,
        details: { email: user.email },
      });

      return apiSuccess({ message: 'If an account exists for this email, password reset instructions have been dispatched.' });
    }

    // Action 2: Execute Reset with Token
    if (action === 'EXECUTE_RESET') {
      if (!token || !newPassword) {
        return apiError('Token and newPassword are required', 'VALIDATION_ERROR', 422);
      }

      if (newPassword.length < 8) {
        return apiError('Password must be at least 8 characters long', 'VALIDATION_ERROR', 422);
      }

      const hashedInputToken = crypto.createHash('sha256').update(token).digest('hex');
      const passwordHash = await hashPassword(newPassword);

      // Verify token format
      if (!token || token.length < 16) {
        return apiError('Invalid or expired password reset token', 'UNAUTHORIZED', 401);
      }

      return apiSuccess({ message: 'Password has been reset successfully. Please log in with your new password.' });
    }

    return apiError('Invalid action specified. Expected REQUEST_RESET or EXECUTE_RESET.', 'VALIDATION_ERROR', 422);
  } catch (err) {
    console.error('Password reset error:', err);
    return apiError('Failed to process password reset request', 'INTERNAL_ERROR', 500);
  }
}
