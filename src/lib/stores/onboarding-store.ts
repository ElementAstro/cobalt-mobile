import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Onboarding step types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  optional: boolean;
  completed: boolean;
  skipped: boolean;
  data?: Record<string, any>;
  prerequisites?: string[];
  estimatedTime?: number; // in minutes
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  targetAudience: 'beginner' | 'intermediate' | 'advanced' | 'all';
  category: 'setup' | 'features' | 'equipment' | 'imaging';
}

export interface UserOnboardingProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  equipmentTypes: string[];
  primaryGoals: string[];
  timeAvailable: number; // minutes willing to spend on onboarding
  preferredLearningStyle: 'visual' | 'hands-on' | 'guided' | 'self-paced';
}

export interface OnboardingProgress {
  currentFlow?: string;
  currentStep?: string;
  completedFlows: string[];
  completedSteps: string[];
  skippedSteps: string[];
  totalTimeSpent: number; // in minutes
  lastActiveDate: Date;
  progressPercentage: number;
}

export interface OnboardingStoreState {
  // User profile and preferences
  userProfile: UserOnboardingProfile | null;
  
  // Available flows and current state
  availableFlows: OnboardingFlow[];
  currentFlow: OnboardingFlow | null;
  currentStepIndex: number;
  
  // Progress tracking
  progress: OnboardingProgress;
  
  // UI state
  isOnboardingActive: boolean;
  isStepCompleted: boolean;
  showSkipOption: boolean;
  showProgressIndicator: boolean;
  
  // Tutorial state
  highlightedElement: string | null;
  tooltipPosition: { x: number; y: number } | null;
  
  // Actions
  startOnboarding: (flowId?: string) => void;
  completeOnboarding: () => void;
  pauseOnboarding: () => void;
  resumeOnboarding: () => void;
  
  // Step navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  skipStep: () => void;
  completeStep: (data?: Record<string, any>) => void;
  
  // Flow management
  selectFlow: (flowId: string) => void;
  createCustomFlow: (steps: string[]) => void;
  
  // Profile management
  updateUserProfile: (profile: Partial<UserOnboardingProfile>) => void;
  
  // Progress tracking
  updateProgress: () => void;
  getRecommendedFlows: () => OnboardingFlow[];
  
  // Tutorial helpers
  highlightElement: (elementId: string, position?: { x: number; y: number }) => void;
  clearHighlight: () => void;
  
  // Utility
  resetOnboarding: () => void;
  exportProgress: () => string;
  importProgress: (data: string) => boolean;
}

// Default onboarding flows
const defaultFlows: OnboardingFlow[] = [
  {
    id: 'welcome',
    name: 'Welcome to Cobalt Mobile',
    description: 'Get started with the basics of astrophotography control',
    targetAudience: 'all',
    category: 'setup',
    steps: [
      {
        id: 'welcome-intro',
        title: 'Welcome to Cobalt Mobile',
        description: 'Your advanced astrophotography control platform',
        component: 'WelcomeIntro',
        optional: false,
        completed: false,
        skipped: false,
        estimatedTime: 2,
      },
      {
        id: 'profile-setup',
        title: 'Tell Us About Yourself',
        description: 'Help us customize your experience',
        component: 'ProfileSetup',
        optional: false,
        completed: false,
        skipped: false,
        estimatedTime: 3,
      },
      {
        id: 'app-overview',
        title: 'App Overview',
        description: 'Learn about the main features and navigation',
        component: 'AppOverview',
        optional: false,
        completed: false,
        skipped: false,
        estimatedTime: 5,
      },
      {
        id: 'first-connection',
        title: 'Connect Your Equipment',
        description: 'Set up your first equipment connection',
        component: 'FirstConnection',
        optional: true,
        completed: false,
        skipped: false,
        estimatedTime: 8,
      },
    ],
  },
  {
    id: 'equipment-basics',
    name: 'Equipment Control Basics',
    description: 'Learn how to control your astrophotography equipment',
    targetAudience: 'beginner',
    category: 'equipment',
    steps: [
      {
        id: 'camera-control',
        title: 'Camera Control',
        description: 'Learn to control your camera settings and capture images',
        component: 'CameraControlTutorial',
        optional: false,
        completed: false,
        skipped: false,
        estimatedTime: 10,
      },
      {
        id: 'mount-control',
        title: 'Mount Control',
        description: 'Master telescope mount operations and alignment',
        component: 'MountControlTutorial',
        optional: false,
        completed: false,
        skipped: false,
        estimatedTime: 12,
      },
      {
        id: 'filter-wheel',
        title: 'Filter Wheel Operations',
        description: 'Learn to use automated filter wheels',
        component: 'FilterWheelTutorial',
        optional: true,
        completed: false,
        skipped: false,
        estimatedTime: 8,
        prerequisites: ['camera-control'],
      },
    ],
  },
  {
    id: 'sequence-planning',
    name: 'Imaging Sequence Planning',
    description: 'Create and manage automated imaging sequences',
    targetAudience: 'intermediate',
    category: 'imaging',
    steps: [
      {
        id: 'target-selection',
        title: 'Target Selection',
        description: 'Choose and plan your imaging targets',
        component: 'TargetSelectionTutorial',
        optional: false,
        completed: false,
        skipped: false,
        estimatedTime: 15,
      },
      {
        id: 'sequence-creation',
        title: 'Creating Sequences',
        description: 'Build automated imaging sequences',
        component: 'SequenceCreationTutorial',
        optional: false,
        completed: false,
        skipped: false,
        estimatedTime: 20,
        prerequisites: ['target-selection'],
      },
      {
        id: 'advanced-automation',
        title: 'Advanced Automation',
        description: 'Set up complex automation rules and conditions',
        component: 'AdvancedAutomationTutorial',
        optional: true,
        completed: false,
        skipped: false,
        estimatedTime: 25,
        prerequisites: ['sequence-creation'],
      },
    ],
  },
];

// Initial progress state
const initialProgress: OnboardingProgress = {
  completedFlows: [],
  completedSteps: [],
  skippedSteps: [],
  totalTimeSpent: 0,
  lastActiveDate: new Date(),
  progressPercentage: 0,
};

// Create onboarding store
export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      userProfile: null,
      availableFlows: defaultFlows,
      currentFlow: null,
      currentStepIndex: 0,
      progress: initialProgress,
      isOnboardingActive: false,
      isStepCompleted: false,
      showSkipOption: true,
      showProgressIndicator: true,
      highlightedElement: null,
      tooltipPosition: null,

      // Start onboarding
      startOnboarding: (flowId) => {
        const flows = get().availableFlows;
        const targetFlow = flowId 
          ? flows.find(f => f.id === flowId)
          : flows.find(f => f.id === 'welcome') || flows[0];

        if (targetFlow) {
          set({
            currentFlow: targetFlow,
            currentStepIndex: 0,
            isOnboardingActive: true,
            isStepCompleted: false,
          });
        }
      },

      // Complete onboarding
      completeOnboarding: () => {
        const { currentFlow, progress } = get();
        if (currentFlow) {
          const updatedProgress = {
            ...progress,
            completedFlows: [...progress.completedFlows, currentFlow.id],
            lastActiveDate: new Date(),
          };

          set({
            progress: updatedProgress,
            isOnboardingActive: false,
            currentFlow: null,
            currentStepIndex: 0,
          });

          get().updateProgress();
        }
      },

      // Pause onboarding
      pauseOnboarding: () => {
        set({
          isOnboardingActive: false,
        });
      },

      // Resume onboarding
      resumeOnboarding: () => {
        const { currentFlow } = get();
        if (currentFlow) {
          set({
            isOnboardingActive: true,
          });
        }
      },

      // Navigate to next step
      nextStep: () => {
        const { currentFlow, currentStepIndex } = get();
        if (currentFlow && currentStepIndex < currentFlow.steps.length - 1) {
          set({
            currentStepIndex: currentStepIndex + 1,
            isStepCompleted: false,
          });
        } else {
          // Flow completed
          get().completeOnboarding();
        }
      },

      // Navigate to previous step
      previousStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({
            currentStepIndex: currentStepIndex - 1,
            isStepCompleted: false,
          });
        }
      },

      // Go to specific step
      goToStep: (stepIndex) => {
        const { currentFlow } = get();
        if (currentFlow && stepIndex >= 0 && stepIndex < currentFlow.steps.length) {
          set({
            currentStepIndex: stepIndex,
            isStepCompleted: false,
          });
        }
      },

      // Skip current step
      skipStep: () => {
        const { currentFlow, currentStepIndex, progress } = get();
        if (currentFlow) {
          const currentStep = currentFlow.steps[currentStepIndex];
          const updatedProgress = {
            ...progress,
            skippedSteps: [...progress.skippedSteps, currentStep.id],
          };

          set({
            progress: updatedProgress,
          });

          get().nextStep();
        }
      },

      // Complete current step
      completeStep: (data) => {
        const { currentFlow, currentStepIndex, progress } = get();
        if (currentFlow) {
          const currentStep = currentFlow.steps[currentStepIndex];
          
          // Update step data if provided
          if (data) {
            currentStep.data = { ...currentStep.data, ...data };
          }

          const updatedProgress = {
            ...progress,
            completedSteps: [...progress.completedSteps, currentStep.id],
            totalTimeSpent: progress.totalTimeSpent + (currentStep.estimatedTime || 0),
          };

          set({
            progress: updatedProgress,
            isStepCompleted: true,
          });

          get().updateProgress();
        }
      },

      // Select flow
      selectFlow: (flowId) => {
        const flows = get().availableFlows;
        const flow = flows.find(f => f.id === flowId);
        if (flow) {
          set({
            currentFlow: flow,
            currentStepIndex: 0,
            isStepCompleted: false,
          });
        }
      },

      // Create custom flow
      createCustomFlow: (stepIds) => {
        const { availableFlows } = get();
        const allSteps = availableFlows.flatMap(f => f.steps);
        const selectedSteps = stepIds
          .map(id => allSteps.find(s => s.id === id))
          .filter(Boolean) as OnboardingStep[];

        if (selectedSteps.length > 0) {
          const customFlow: OnboardingFlow = {
            id: 'custom-' + Date.now(),
            name: 'Custom Onboarding',
            description: 'Your personalized onboarding experience',
            targetAudience: 'all',
            category: 'setup',
            steps: selectedSteps,
          };

          set({
            currentFlow: customFlow,
            currentStepIndex: 0,
            isStepCompleted: false,
          });
        }
      },

      // Update user profile
      updateUserProfile: (profileUpdates) => {
        const { userProfile } = get();
        set({
          userProfile: { ...userProfile, ...profileUpdates } as UserOnboardingProfile,
        });
      },

      // Update progress calculation
      updateProgress: () => {
        const { progress, availableFlows } = get();
        const totalSteps = availableFlows.reduce((acc, flow) => acc + flow.steps.length, 0);
        const completedSteps = progress.completedSteps.length;
        const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        set({
          progress: {
            ...progress,
            progressPercentage,
            lastActiveDate: new Date(),
          },
        });
      },

      // Get recommended flows
      getRecommendedFlows: () => {
        const { userProfile, progress } = get();
        const flows = get().availableFlows;

        if (!userProfile) {
          return flows.filter(f => f.targetAudience === 'all');
        }

        return flows.filter(flow => {
          // Filter by experience level
          if (flow.targetAudience !== 'all' && flow.targetAudience !== userProfile.experienceLevel) {
            return false;
          }

          // Filter out completed flows
          if (progress.completedFlows.includes(flow.id)) {
            return false;
          }

          return true;
        });
      },

      // Highlight element for tutorial
      highlightElement: (elementId, position) => {
        set({
          highlightedElement: elementId,
          tooltipPosition: position || null,
        });
      },

      // Clear highlight
      clearHighlight: () => {
        set({
          highlightedElement: null,
          tooltipPosition: null,
        });
      },

      // Reset onboarding
      resetOnboarding: () => {
        set({
          userProfile: null,
          currentFlow: null,
          currentStepIndex: 0,
          progress: initialProgress,
          isOnboardingActive: false,
          isStepCompleted: false,
          highlightedElement: null,
          tooltipPosition: null,
        });
      },

      // Export progress
      exportProgress: () => {
        const { userProfile, progress } = get();
        return JSON.stringify({
          userProfile,
          progress,
          exportDate: new Date().toISOString(),
        });
      },

      // Import progress
      importProgress: (data) => {
        try {
          const imported = JSON.parse(data);
          if (imported.userProfile && imported.progress) {
            set({
              userProfile: imported.userProfile,
              progress: imported.progress,
            });
            return true;
          }
        } catch (error) {
          console.error('Failed to import onboarding progress:', error);
        }
        return false;
      },
    }),
    {
      name: 'onboarding-store',
      partialize: (state) => ({
        userProfile: state.userProfile,
        progress: state.progress,
        currentFlow: state.currentFlow,
        currentStepIndex: state.currentStepIndex,
      }),
    }
  )
);
