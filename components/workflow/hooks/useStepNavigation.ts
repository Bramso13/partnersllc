import { useState, useRef, useMemo } from "react";
import type { UseStepNavigationReturn, StepInstanceForTimer } from "../types";
import type { ProductStep } from "@/lib/workflow";

/**
 * Custom hook to manage workflow step navigation and timer-based blocking.
 *
 * Handles:
 * - Current step index tracking
 * - Navigation forward/backward/to specific step
 * - TIMER step blocking logic (delays next step after timer completion)
 * - Step loading cache reset
 *
 * @param productSteps - Array of product steps in the workflow
 * @param stepInstances - Step instances for TIMER calculations
 * @param initialStepId - Optional initial step ID from URL
 * @returns Navigation state and handlers
 *
 * @example
 * const navigation = useStepNavigation({ productSteps, stepInstances, initialStepId });
 * <button onClick={navigation.goToNextStep}>Next</button>
 */
export function useStepNavigation({
  productSteps,
  stepInstances = [],
  initialStepId,
}: {
  productSteps: ProductStep[];
  stepInstances?: StepInstanceForTimer[];
  initialStepId?: string;
}): UseStepNavigationReturn {
  const lastLoadedStepIdRef = useRef<string | null>(null);

  // Initialize with step from URL if provided, otherwise start at 0
  const getInitialStepIndex = () => {
    if (initialStepId) {
      const index = productSteps.findIndex(
        (ps) => ps.step_id === initialStepId
      );
      return index >= 0 ? index : 0;
    }
    return 0;
  };

  const [currentStepIndex, setCurrentStepIndex] = useState(
    getInitialStepIndex()
  );

  /**
   * Calculate when the next step becomes available after a TIMER step.
   * TIMER steps introduce delays before the next step can be accessed.
   *
   * @param stepIndex - Index of the step to check
   * @returns Timestamp when step becomes available, or null if not blocked
   */
  const getNextStepAvailableAt = (stepIndex: number): number | null => {
    if (stepIndex < 1) return null;

    const prevProductStep = productSteps[stepIndex - 1];

    // Check if previous step is a TIMER step with a delay
    if (
      prevProductStep?.step?.step_type !== "TIMER" ||
      !prevProductStep.timer_delay_minutes
    ) {
      return null;
    }

    // Get the step before the TIMER to find completion time
    const stepBeforeTimer = productSteps[stepIndex - 2];
    if (!stepBeforeTimer?.step_id) return null;

    // Find when the step before timer was completed
    const completedAt = stepInstances.find(
      (si) => si.step_id === stepBeforeTimer.step_id
    )?.completed_at;

    if (!completedAt) return null;

    // Calculate availability timestamp: completion time + delay
    return (
      new Date(completedAt).getTime() +
      prevProductStep.timer_delay_minutes * 60 * 1000
    );
  };

  // Check if next step is blocked by a TIMER delay
  const nextStepAvailableAt = useMemo(
    () => getNextStepAvailableAt(currentStepIndex + 1),
    [currentStepIndex, productSteps, stepInstances]
  );

  const isNextStepBlockedByTimer =
    nextStepAvailableAt != null && Date.now() < nextStepAvailableAt;

  const timerRemainingMinutes =
    nextStepAvailableAt != null && nextStepAvailableAt > Date.now()
      ? Math.ceil((nextStepAvailableAt - Date.now()) / 60000)
      : 0;

  const goToStep = (index: number) => {
    setCurrentStepIndex(index);
    lastLoadedStepIdRef.current = null; // Reset cache to force reload
  };

  const goToNextStep = () => {
    if (currentStepIndex < productSteps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      // Last step completed, redirect to dashboard
      window.location.href = "/dashboard";
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const resetLoadedStep = () => {
    lastLoadedStepIdRef.current = null;
  };

  return {
    currentStepIndex,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    getNextStepAvailableAt,
    isNextStepBlockedByTimer,
    timerRemainingMinutes,
    resetLoadedStep,
  };
}
