import { db } from './db';
import { logAuditEvent } from './audit';

export interface WorkflowTransitionContext {
  organizationId: string;
  userId: string;
  userRoleCodes: string[];
  entityName: string; // LEAVE, EMPLOYEE, STUDENT, CANDIDATE, TICKET, PERFORMANCE, PAYROLL
  entityId: string;
  currentState: string;
  targetState: string;
  actionReason?: string;
  details?: Record<string, any>;
}

export interface TransitionResult {
  success: boolean;
  previousState: string;
  newState: string;
  message?: string;
}

export async function executeWorkflowTransition(
  ctx: WorkflowTransitionContext,
  updateCallback: (tx: any) => Promise<any>
): Promise<TransitionResult> {
  const { organizationId, userId, userRoleCodes, entityName, entityId, currentState, targetState, actionReason, details } = ctx;

  // 1. Fetch Tenant WorkflowDefinition for Entity (if customized in Phase 5)
  const wfDef = await db.workflowDefinition.findFirst({
    where: { organizationId, entityName },
  });

  if (wfDef) {
    const states = Array.isArray(wfDef.states) ? (wfDef.states as string[]) : [];
    const transitions = Array.isArray(wfDef.transitions) ? (wfDef.transitions as any[]) : [];

    if (states.length > 0 && !states.includes(targetState)) {
      throw new Error(`INVALID_STATE: Target state '${targetState}' is not defined in workflow for entity '${entityName}'.`);
    }

    if (transitions.length > 0) {
      const validTransition = transitions.find(
        (t) => t.from === currentState && t.to === targetState
      );
      if (!validTransition) {
        throw new Error(`INVALID_TRANSITION: Transition from '${currentState}' to '${targetState}' is not permitted.`);
      }
    }
  }

  // 2. Perform Atomic State Transition Transaction
  const result = await db.$transaction(async (tx) => {
    const updatedEntity = await updateCallback(tx);

    // Create Audit Log
    await logAuditEvent({
      organizationId,
      userId,
      action: `${entityName}_TRANSITION_${currentState}_TO_${targetState}`,
      entity: entityName,
      entityId,
      details: {
        previousState: currentState,
        newState: targetState,
        reason: actionReason || null,
        ...(details || {}),
      },
    });

    // Create Notification Event for system tracking
    await tx.notification.create({
      data: {
        organizationId,
        title: `${entityName} Status Changed`,
        message: `${entityName} status updated from ${currentState} to ${targetState}.`,
        type: 'WORKFLOW',
        isRead: false,
      },
    });

    return updatedEntity;
  });

  return {
    success: true,
    previousState: currentState,
    newState: targetState,
  };
}
