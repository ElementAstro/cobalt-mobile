import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import TargetPlanner, { 
  Target, 
  ObservatoryLocation, 
  ImagingSession, 
  SessionPlan, 
  PlanningConstraints, 
  TargetVisibility,
  targetPlanner 
} from '../target-planning/target-planner';
import { 
  targetDatabase, 
  observatoryLocations, 
  getCurrentSeasonTargets,
  getBeginnerTargets 
} from '../target-planning/target-database';

export interface TargetPlanningState {
  // Observatory and location
  currentObservatory: ObservatoryLocation;
  availableObservatories: ObservatoryLocation[];
  
  // Target management
  availableTargets: Target[];
  selectedTargets: Target[];
  favoriteTargets: string[]; // target IDs
  customTargets: Target[];
  
  // Session planning
  currentSessionPlan: SessionPlan | null;
  plannedSessions: ImagingSession[];
  sessionHistory: ImagingSession[];
  
  // Planning constraints
  planningConstraints: PlanningConstraints;
  
  // Target visibility
  targetVisibilities: Map<string, TargetVisibility>;
  lastVisibilityUpdate: Date | null;
  
  // Multi-night planning
  multiNightPlans: SessionPlan[];
  planningDateRange: {
    start: Date;
    end: Date;
  };
  
  // Filters and search
  targetFilters: {
    type: Target['type'] | 'all';
    season: Target['season'] | 'all';
    difficulty: Target['difficulty'] | 'all';
    constellation: string | 'all';
    minMagnitude: number;
    maxMagnitude: number;
    minSize: number; // arcminutes
    maxSize: number; // arcminutes
  };
  searchQuery: string;
  
  // UI state
  isPlanning: boolean;
  selectedDate: Date;
  viewMode: 'targets' | 'sessions' | 'calendar' | 'visibility';
  
  // Actions
  setObservatory: (observatory: ObservatoryLocation) => void;
  addCustomObservatory: (observatory: ObservatoryLocation) => void;
  selectTargets: (targetIds: string[]) => void;
  addToFavorites: (targetId: string) => void;
  removeFromFavorites: (targetId: string) => void;
  addCustomTarget: (target: Target) => void;
  removeCustomTarget: (targetId: string) => void;
  updatePlanningConstraints: (constraints: Partial<PlanningConstraints>) => void;
  planSession: (date: Date, targetIds?: string[]) => Promise<void>;
  planMultiNightSessions: (startDate: Date, numberOfNights: number, targetIds?: string[]) => Promise<void>;
  updateTargetVisibility: (date?: Date) => Promise<void>;
  scheduleSession: (session: ImagingSession) => void;
  updateSessionStatus: (sessionId: string, status: ImagingSession['status']) => void;
  setTargetFilters: (filters: Partial<TargetPlanningState['targetFilters']>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: TargetPlanningState['viewMode']) => void;
  clearPlanning: () => void;
  exportSessionPlan: (plan: SessionPlan) => string;
  
  // Computed getters
  getFilteredTargets: () => Target[];
  getVisibleTargets: (date?: Date) => Target[];
  getBestTargetsForDate: (date: Date) => Target[];
  getTargetVisibility: (targetId: string) => TargetVisibility | null;
  getUpcomingSessions: () => ImagingSession[];
  getTonightsSessions: () => ImagingSession[];
  getSessionStatistics: () => {
    total: number;
    completed: number;
    planned: number;
    cancelled: number;
  };
}

export const useTargetPlanningStore = create<TargetPlanningState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentObservatory: observatoryLocations[0],
      availableObservatories: observatoryLocations,
      availableTargets: targetDatabase,
      selectedTargets: [],
      favoriteTargets: [],
      customTargets: [],
      currentSessionPlan: null,
      plannedSessions: [],
      sessionHistory: [],
      planningConstraints: {
        minAltitude: 30,
        maxAirmass: 2.5,
        moonAvoidance: 30,
        maxMoonPhase: 0.7,
        minMoonSeparation: 45,
        twilightType: 'astronomical',
        maxCloudCover: 30,
        minTransparency: 6,
        maxSeeing: 4,
        meridianFlipTolerance: 15,
        sessionDuration: { min: 30, max: 480 }
      },
      targetVisibilities: new Map(),
      lastVisibilityUpdate: null,
      multiNightPlans: [],
      planningDateRange: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      targetFilters: {
        type: 'all',
        season: 'all',
        difficulty: 'all',
        constellation: 'all',
        minMagnitude: 0,
        maxMagnitude: 15,
        minSize: 0,
        maxSize: 1000
      },
      searchQuery: '',
      isPlanning: false,
      selectedDate: new Date(),
      viewMode: 'targets',

      // Actions
      setObservatory: (observatory) => {
        set({ currentObservatory: observatory });
        // Update target planner instance
        targetPlanner.observatoryLocation = observatory;
        // Refresh visibility calculations
        get().updateTargetVisibility();
      },

      addCustomObservatory: (observatory) => {
        const { availableObservatories } = get();
        set({
          availableObservatories: [...availableObservatories, observatory]
        });
      },

      selectTargets: (targetIds) => {
        const { availableTargets, customTargets } = get();
        const allTargets = [...availableTargets, ...customTargets];
        const targets = targetIds.map(id => allTargets.find(t => t.id === id)).filter(Boolean) as Target[];
        set({ selectedTargets: targets });
      },

      addToFavorites: (targetId) => {
        const { favoriteTargets } = get();
        if (!favoriteTargets.includes(targetId)) {
          set({ favoriteTargets: [...favoriteTargets, targetId] });
        }
      },

      removeFromFavorites: (targetId) => {
        const { favoriteTargets } = get();
        set({ favoriteTargets: favoriteTargets.filter(id => id !== targetId) });
      },

      addCustomTarget: (target) => {
        const { customTargets } = get();
        set({ customTargets: [...customTargets, target] });
      },

      removeCustomTarget: (targetId) => {
        const { customTargets } = get();
        set({ customTargets: customTargets.filter(t => t.id !== targetId) });
      },

      updatePlanningConstraints: (constraints) => {
        const { planningConstraints } = get();
        set({
          planningConstraints: { ...planningConstraints, ...constraints }
        });
      },

      planSession: async (date, targetIds) => {
        set({ isPlanning: true });
        
        try {
          const { selectedTargets, availableTargets, customTargets, planningConstraints } = get();
          const allTargets = [...availableTargets, ...customTargets];
          
          let targetsToUse = selectedTargets;
          if (targetIds) {
            targetsToUse = targetIds.map(id => allTargets.find(t => t.id === id)).filter(Boolean) as Target[];
          }
          
          if (targetsToUse.length === 0) {
            // Use current season targets if none selected
            targetsToUse = getCurrentSeasonTargets().slice(0, 5);
          }
          
          const plan = targetPlanner.planOptimalSession(targetsToUse, date, planningConstraints);
          
          set({
            currentSessionPlan: plan,
            selectedDate: date,
            isPlanning: false
          });
        } catch (error) {
          console.error('Session planning failed:', error);
          set({ isPlanning: false });
        }
      },

      planMultiNightSessions: async (startDate, numberOfNights, targetIds) => {
        set({ isPlanning: true });
        
        try {
          const { selectedTargets, availableTargets, customTargets, planningConstraints } = get();
          const allTargets = [...availableTargets, ...customTargets];
          
          let targetsToUse = selectedTargets;
          if (targetIds) {
            targetsToUse = targetIds.map(id => allTargets.find(t => t.id === id)).filter(Boolean) as Target[];
          }
          
          if (targetsToUse.length === 0) {
            targetsToUse = getCurrentSeasonTargets().slice(0, 10);
          }
          
          const plans = targetPlanner.planMultiNightSession(targetsToUse, startDate, numberOfNights, planningConstraints);
          
          set({
            multiNightPlans: plans,
            planningDateRange: {
              start: startDate,
              end: new Date(startDate.getTime() + numberOfNights * 24 * 60 * 60 * 1000)
            },
            isPlanning: false
          });
        } catch (error) {
          console.error('Multi-night planning failed:', error);
          set({ isPlanning: false });
        }
      },

      updateTargetVisibility: async (date) => {
        const targetDate = date || get().selectedDate;
        const { availableTargets, customTargets, planningConstraints } = get();
        const allTargets = [...availableTargets, ...customTargets];
        
        const visibilities = new Map<string, TargetVisibility>();
        
        for (const target of allTargets) {
          try {
            const visibility = targetPlanner.calculateTargetVisibility(target, targetDate, planningConstraints);
            visibilities.set(target.id, visibility);
          } catch (error) {
            console.error(`Failed to calculate visibility for ${target.name}:`, error);
          }
        }
        
        set({
          targetVisibilities: visibilities,
          lastVisibilityUpdate: new Date()
        });
      },

      scheduleSession: (session) => {
        const { plannedSessions } = get();
        set({
          plannedSessions: [...plannedSessions, session]
        });
      },

      updateSessionStatus: (sessionId, status) => {
        const { plannedSessions, sessionHistory } = get();
        const sessionIndex = plannedSessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex >= 0) {
          const updatedSessions = [...plannedSessions];
          updatedSessions[sessionIndex] = { ...updatedSessions[sessionIndex], status };
          
          // Move completed/cancelled sessions to history
          if (status === 'completed' || status === 'cancelled' || status === 'weather_cancelled') {
            const completedSession = updatedSessions.splice(sessionIndex, 1)[0];
            set({
              plannedSessions: updatedSessions,
              sessionHistory: [...sessionHistory, completedSession]
            });
          } else {
            set({ plannedSessions: updatedSessions });
          }
        }
      },

      setTargetFilters: (filters) => {
        const { targetFilters } = get();
        set({
          targetFilters: { ...targetFilters, ...filters }
        });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSelectedDate: (date) => {
        set({ selectedDate: date });
        // Update visibility for new date
        get().updateTargetVisibility(date);
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      clearPlanning: () => {
        set({
          currentSessionPlan: null,
          multiNightPlans: [],
          selectedTargets: []
        });
      },

      exportSessionPlan: (plan) => {
        const exportData = {
          date: plan.date.toISOString(),
          observatory: get().currentObservatory.name,
          sessions: plan.sessions,
          conditions: plan.conditions,
          recommendations: plan.recommendations,
          warnings: plan.warnings,
          exportedAt: new Date().toISOString()
        };
        return JSON.stringify(exportData, null, 2);
      },

      // Computed getters
      getFilteredTargets: () => {
        const { availableTargets, customTargets, targetFilters, searchQuery, favoriteTargets } = get();
        let targets = [...availableTargets, ...customTargets];
        
        // Apply search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          targets = targets.filter(target =>
            target.name.toLowerCase().includes(query) ||
            target.commonName?.toLowerCase().includes(query) ||
            target.constellation.toLowerCase().includes(query)
          );
        }
        
        // Apply filters
        if (targetFilters.type !== 'all') {
          targets = targets.filter(target => target.type === targetFilters.type);
        }
        
        if (targetFilters.season !== 'all') {
          targets = targets.filter(target => 
            target.season === targetFilters.season || target.season === 'all'
          );
        }
        
        if (targetFilters.difficulty !== 'all') {
          targets = targets.filter(target => target.difficulty === targetFilters.difficulty);
        }
        
        if (targetFilters.constellation !== 'all') {
          targets = targets.filter(target => target.constellation === targetFilters.constellation);
        }
        
        // Magnitude filter
        targets = targets.filter(target =>
          target.magnitude >= targetFilters.minMagnitude &&
          target.magnitude <= targetFilters.maxMagnitude
        );
        
        // Size filter
        targets = targets.filter(target =>
          target.size.major >= targetFilters.minSize &&
          target.size.major <= targetFilters.maxSize
        );
        
        // Sort favorites first
        targets.sort((a, b) => {
          const aFav = favoriteTargets.includes(a.id) ? 1 : 0;
          const bFav = favoriteTargets.includes(b.id) ? 1 : 0;
          if (aFav !== bFav) return bFav - aFav;
          return a.name.localeCompare(b.name);
        });
        
        return targets;
      },

      getVisibleTargets: (date) => {
        const { targetVisibilities } = get();
        const targets: Target[] = [];
        
        for (const [targetId, visibility] of targetVisibilities) {
          if (visibility.isVisible && visibility.quality !== 'poor') {
            targets.push(visibility.target);
          }
        }
        
        return targets.sort((a, b) => {
          const visA = targetVisibilities.get(a.id);
          const visB = targetVisibilities.get(b.id);
          if (!visA || !visB) return 0;
          
          // Sort by quality, then altitude
          const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
          const qualityDiff = qualityOrder[visB.quality] - qualityOrder[visA.quality];
          if (qualityDiff !== 0) return qualityDiff;
          
          return visB.altitude - visA.altitude;
        });
      },

      getBestTargetsForDate: (date) => {
        const { availableTargets, customTargets, planningConstraints } = get();
        const allTargets = [...availableTargets, ...customTargets];
        
        const targetScores = allTargets.map(target => {
          try {
            const visibility = targetPlanner.calculateTargetVisibility(target, date, planningConstraints);
            let score = 0;
            
            if (visibility.isVisible) {
              score += 50;
              score += Math.min(30, visibility.altitude - 30); // Altitude bonus
              score += Math.min(20, visibility.moonSeparation - 30); // Moon separation bonus
              
              const qualityBonus = { excellent: 20, good: 15, fair: 10, poor: 0 };
              score += qualityBonus[visibility.quality];
            }
            
            return { target, score, visibility };
          } catch (error) {
            return { target, score: 0, visibility: null };
          }
        });
        
        return targetScores
          .filter(item => item.score > 50)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(item => item.target);
      },

      getTargetVisibility: (targetId) => {
        const { targetVisibilities } = get();
        return targetVisibilities.get(targetId) || null;
      },

      getUpcomingSessions: () => {
        const { plannedSessions } = get();
        const now = new Date();
        return plannedSessions
          .filter(session => session.startTime > now)
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      },

      getTonightsSessions: () => {
        const { plannedSessions } = get();
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return plannedSessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate.toDateString() === today.toDateString();
        });
      },

      getSessionStatistics: () => {
        const { plannedSessions, sessionHistory } = get();
        const allSessions = [...plannedSessions, ...sessionHistory];
        
        return {
          total: allSessions.length,
          completed: allSessions.filter(s => s.status === 'completed').length,
          planned: allSessions.filter(s => s.status === 'planned').length,
          cancelled: allSessions.filter(s => s.status === 'cancelled' || s.status === 'weather_cancelled').length
        };
      }
    }),
    {
      name: 'target-planning-storage',
      partialize: (state) => ({
        currentObservatory: state.currentObservatory,
        availableObservatories: state.availableObservatories,
        favoriteTargets: state.favoriteTargets,
        customTargets: state.customTargets,
        planningConstraints: state.planningConstraints,
        targetFilters: state.targetFilters,
        plannedSessions: state.plannedSessions,
        sessionHistory: state.sessionHistory.slice(-50), // Keep last 50 sessions
      })
    }
  )
);

// Auto-update visibility every hour
let visibilityUpdateTimer: NodeJS.Timeout | null = null;

export const startVisibilityUpdates = () => {
  if (visibilityUpdateTimer) {
    clearInterval(visibilityUpdateTimer);
  }
  
  visibilityUpdateTimer = setInterval(() => {
    const store = useTargetPlanningStore.getState();
    store.updateTargetVisibility();
  }, 60 * 60 * 1000); // Every hour
};

export const stopVisibilityUpdates = () => {
  if (visibilityUpdateTimer) {
    clearInterval(visibilityUpdateTimer);
    visibilityUpdateTimer = null;
  }
};

// Initialize visibility updates
startVisibilityUpdates();

export default useTargetPlanningStore;
