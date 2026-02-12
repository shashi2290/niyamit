import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useTasks } from '../contexts/TaskContext';
import { useNavigate, useLocation } from 'react-router-dom';

const OnboardingTour = () => {
  const { tasks, loading } = useTasks();
  const navigate = useNavigate();
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    // Check localStorage during initial state setup to avoid effect
    return !!localStorage.getItem('niyamit-tour-completed');
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const pendingStepIndex = useRef(null);

  // Define steps with their associated routes
  const steps = useMemo(() => {
    return [
      {
        target: ".sidebar",
        content: (
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
              Welcome to Niyamit! 👋
            </h3>
            <p style={{ margin: 0 }}>
              This is your personal life organizer. Let me show you around the
              app.
            </p>
          </div>
        ),
        placement: "right",
        disableBeacon: true,
        route: "/", // Dashboard page
      },
      {
        target: ".sidebar-nav .nav-item:first-child",
        content: (
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
              Navigation
            </h3>
            <p style={{ margin: 0 }}>
              Use these links to switch between Analytics Dashboard, Calendar
              Schedule, and Settings.
            </p>
          </div>
        ),
        placement: "right",
        route: "/",
      },
      {
        target: '.task-form-container, [class*="task-form"]',
        content: (
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
              Creating Tasks
            </h3>
            <p style={{ margin: 0 }}>
              Create new tasks by entering a title, selecting time range, and
              choosing a category tag. Press Enter or click "Add" to save!
            </p>
          </div>
        ),
        placement: "bottom",
        route: "/calendar",
      },
      {
        target: '.task-sidebar, aside[class*="task-sidebar"]',
        content: (
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
              Your Tasks
            </h3>
            <p style={{ margin: 0 }}>
              Your tasks for the selected day appear here. Click the circle to
              mark them complete, or click the task itself to edit details.
            </p>
          </div>
        ),
        placement: "left",
        route: "/calendar",
      },
      {
        target: '[class*="time-grid"]',
        content: (
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
              Drag & Drop
            </h3>
            <p style={{ margin: 0 }}>
              You can drag and drop tasks to reschedule them to different times
              or even different days! Try it out.
            </p>
          </div>
        ),
        placement: "top",
        route: "/calendar",
      },
      {
        target: '.tag-selector, select[class*="tag"]',
        content: (
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
              Organize with Tags
            </h3>
            <p style={{ margin: 0 }}>
              Use tags to categorize your tasks (Work, Personal, Health, etc.).
              Click the + button to create custom tags!
            </p>
          </div>
        ),
        placement: "top",
        route: "/calendar",
      },
      {
        target: ".settings-page",
        content: (
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
              Settings
            </h3>
            <p style={{ margin: 0 }}>
              Manage your tags and customize your experience here. You can edit
              tag names and colors.
            </p>
          </div>
        ),
        placement: "right",
        route: "/settings",
      },
      {
        target: ".page-container",
        content: (
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
              You're All Set! 🎉
            </h3>
            <p style={{ margin: 0 }}>
              Start by completing one of the welcome tasks. Remember: Tasks can
              be edited within 3 hours after their scheduled time. Good luck!
            </p>
          </div>
        ),
        placement: "center",
        route: "/settings",
      },
    ];
  },[]);

  // Navigate to the correct route for a step
  const navigateToStepRoute = useCallback((targetStepIndex) => {
    const step = steps[targetStepIndex];
    if (step && step.route && location.pathname !== step.route) {
      setIsNavigating(true);
      pendingStepIndex.current = targetStepIndex;
      navigate(step.route);
      return true;
    }
    return false;
  }, [navigate, location.pathname, steps]);

  // Start tour when tasks are loaded
  useEffect(() => {
    if (!loading && tasks.length > 0 && !hasCompletedTour && !run && !isNavigating) {
      const timer = setTimeout(() => {
        // Navigate to first step's route if needed
        const firstStepRoute = steps[0]?.route;
        if (firstStepRoute && location.pathname !== firstStepRoute) {
          navigate(firstStepRoute);
        }
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, tasks, hasCompletedTour, run, isNavigating, location.pathname, navigate, steps]);

  // Handle navigation completion - wait for DOM to fully render
  useEffect(() => {
    if (isNavigating && pendingStepIndex.current !== null) {
      // Wait for DOM to update after navigation
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setStepIndex(pendingStepIndex.current);
        pendingStepIndex.current = null;
      }, 800); // Increased delay for DOM to stabilize
      return () => clearTimeout(timer);
    }
  }, [isNavigating, location.pathname]);

  const handleJoyrideCallback = (data) => {
    const { status, index, type, action } = data;

    // Handle tour completion - FINISHED, SKIPPED, or CLOSE
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || status === STATUS.CLOSED) {
      setRun(false);
      setHasCompletedTour(true);
      localStorage.setItem('niyamit-tour-completed', 'true');
      return;
    }

    // Handle step changes
    if (type === 'step:after') {
      const nextStepIndex = action === 'next' ? index + 1 : index - 1;

      // Check bounds - if we're at the end, finish the tour
      if (nextStepIndex >= steps.length) {
        setRun(false);
        setHasCompletedTour(true);
        localStorage.setItem('niyamit-tour-completed', 'true');
        return;
      }

      if (nextStepIndex < 0) {
        return;
      }

      // Check if we need to navigate to a different route for the next step
      const needsNavigation = navigateToStepRoute(nextStepIndex);
      if (!needsNavigation) {
        setStepIndex(nextStepIndex);
      }
    }

    // Handle when target is not found
    if (type === 'error:target_not_found') {
      console.warn(`Target not found for step ${index}:`, steps[index]?.target);
      // Skip to next step if target not found
      if (stepIndex < steps.length - 1) {
        const nextStepIndex = stepIndex + 1;
        const needsNavigation = navigateToStepRoute(nextStepIndex);
        if (!needsNavigation) {
          setStepIndex(nextStepIndex);
        }
      }
    }
  };

  // Custom styles to match the app's dark theme
  const joyrideStyles = {
    options: {
      arrowColor: '#1e293b',
      backgroundColor: '#1e293b',
      overlayColor: 'rgba(15, 23, 42, 0.85)',
      primaryColor: '#8b5cf6',
      textColor: '#f8fafc',
      zIndex: 10000,
      borderRadius: 12,
    },
    tooltip: {
      fontSize: '14px',
      padding: '20px',
    },
    buttonNext: {
      backgroundColor: '#8b5cf6',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 600,
    },
    buttonBack: {
      color: '#94a3b8',
      marginRight: '10px',
      fontSize: '14px',
    },
    buttonSkip: {
      color: '#64748b',
      fontSize: '14px',
    },
    spotlight: {
      borderRadius: 8,
      boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.3)',
    },
    overlay: {
      transition: 'opacity 0.3s ease',
    },
  };

  if (hasCompletedTour) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run && !isNavigating}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableOverlayClose={false}
      disableScrollParentFix={false}
      spotlightClicks={false}
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      floaterProps={{
        disableAnimation: false,
        hideArrow: false,
      }}
      debug={false}
    />
  );
};

export default OnboardingTour;
