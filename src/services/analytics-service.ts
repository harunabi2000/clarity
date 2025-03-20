import { Route } from '@/store/route-store';

interface ActivityMetrics {
  totalDistance: number;
  totalDuration: number;
  totalElevation: number;
  routesCompleted: number;
  streakDays: number;
  lastActivityDate: Date | null;
}

interface UserStats {
  [key: string]: ActivityMetrics;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private stats: UserStats = {};

  private constructor() {
    this.loadStats();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private loadStats() {
    const savedStats = localStorage.getItem('user_stats');
    if (savedStats) {
      this.stats = JSON.parse(savedStats, (key, value) => {
        if (key === 'lastActivityDate' && value) {
          return new Date(value);
        }
        return value;
      });
    }
  }

  private saveStats() {
    localStorage.setItem('user_stats', JSON.stringify(this.stats));
  }

  recordActivity(route: Route) {
    const activity = route.activity;
    if (!this.stats[activity]) {
      this.stats[activity] = {
        totalDistance: 0,
        totalDuration: 0,
        totalElevation: 0,
        routesCompleted: 0,
        streakDays: 0,
        lastActivityDate: null
      };
    }

    const stats = this.stats[activity];
    stats.totalDistance += route.distance;
    stats.totalDuration += route.duration;
    stats.totalElevation += route.elevation;
    stats.routesCompleted += 1;

    // Update streak
    const today = new Date();
    if (stats.lastActivityDate) {
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - stats.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastActivity === 1) {
        stats.streakDays += 1;
      } else if (daysSinceLastActivity > 1) {
        stats.streakDays = 1;
      }
    } else {
      stats.streakDays = 1;
    }
    stats.lastActivityDate = today;

    this.saveStats();
    this.checkAchievements(activity);
  }

  getStats(activity: string): ActivityMetrics {
    return this.stats[activity] || {
      totalDistance: 0,
      totalDuration: 0,
      totalElevation: 0,
      routesCompleted: 0,
      streakDays: 0,
      lastActivityDate: null
    };
  }

  getAllStats(): UserStats {
    return this.stats;
  }

  generateWeeklyReport(): WeeklyReport {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const report: WeeklyReport = {
      totalActivities: 0,
      totalDistance: 0,
      totalDuration: 0,
      topActivity: null,
      improvements: [],
      weeklyGoalProgress: 0
    };

    Object.entries(this.stats).forEach(([activity, metrics]) => {
      if (metrics.lastActivityDate && metrics.lastActivityDate > weekStart) {
        report.totalActivities += metrics.routesCompleted;
        report.totalDistance += metrics.totalDistance;
        report.totalDuration += metrics.totalDuration;
      }
    });

    return report;
  }

  private checkAchievements(activity: string) {
    const stats = this.stats[activity];
    const achievements = [];

    // Distance achievements
    if (stats.totalDistance >= 100) achievements.push('Century');
    if (stats.totalDistance >= 500) achievements.push('Explorer');
    if (stats.totalDistance >= 1000) achievements.push('Adventurer');

    // Streak achievements
    if (stats.streakDays >= 7) achievements.push('Weekly Warrior');
    if (stats.streakDays >= 30) achievements.push('Monthly Master');
    if (stats.streakDays >= 100) achievements.push('Consistency King');

    // Routes completed achievements
    if (stats.routesCompleted >= 10) achievements.push('Route Runner');
    if (stats.routesCompleted >= 50) achievements.push('Path Pioneer');
    if (stats.routesCompleted >= 100) achievements.push('Trail Blazer');

    return achievements;
  }
}

interface WeeklyReport {
  totalActivities: number;
  totalDistance: number;
  totalDuration: number;
  topActivity: string | null;
  improvements: string[];
  weeklyGoalProgress: number;
}

export const analyticsService = AnalyticsService.getInstance();
