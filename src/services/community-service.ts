import { Route } from '@/store/route-store';

export interface CommunityRoute extends Route {
  userId: string;
  username: string;
  likes: number;
  comments: Comment[];
  tags: string[];
  rating: number;
  safetyRating: number;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  scenicRating: number;
  shared: Date;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  likes: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'distance' | 'elevation' | 'streak' | 'exploration';
  goal: number;
  startDate: Date;
  endDate: Date;
  participants: string[];
  leaderboard: LeaderboardEntry[];
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  progress: number;
  rank: number;
}

class CommunityService {
  private static instance: CommunityService;
  private routes: CommunityRoute[] = [];
  private challenges: Challenge[] = [];

  private constructor() {
    this.loadCommunityData();
  }

  static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  private loadCommunityData() {
    // Load from localStorage for now
    // In production, this would be an API call
    const savedRoutes = localStorage.getItem('community_routes');
    const savedChallenges = localStorage.getItem('community_challenges');

    if (savedRoutes) {
      this.routes = JSON.parse(savedRoutes);
    }
    if (savedChallenges) {
      this.challenges = JSON.parse(savedChallenges);
    }
  }

  private saveCommunityData() {
    localStorage.setItem('community_routes', JSON.stringify(this.routes));
    localStorage.setItem('community_challenges', JSON.stringify(this.challenges));
  }

  async shareRoute(route: Route, userId: string, username: string): Promise<CommunityRoute> {
    const communityRoute: CommunityRoute = {
      ...route,
      userId,
      username,
      likes: 0,
      comments: [],
      tags: [],
      rating: 0,
      safetyRating: 0,
      difficultyLevel: 1,
      scenicRating: 0,
      shared: new Date()
    };

    this.routes.unshift(communityRoute);
    this.saveCommunityData();
    return communityRoute;
  }

  async getFeaturedRoutes(): Promise<CommunityRoute[]> {
    // Return routes sorted by rating and recency
    return this.routes
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
  }

  async getNearbyRoutes(lat: number, lon: number, radius: number): Promise<CommunityRoute[]> {
    // Filter routes within radius km of the given coordinates
    return this.routes.filter(route => {
      const startPoint = route.coordinates[0];
      const distance = this.calculateDistance(
        lat,
        lon,
        startPoint[1],
        startPoint[0]
      );
      return distance <= radius;
    });
  }

  async likeRoute(routeId: string, userId: string): Promise<void> {
    const route = this.routes.find(r => r.id === routeId);
    if (route) {
      route.likes += 1;
      this.saveCommunityData();
    }
  }

  async addComment(routeId: string, userId: string, username: string, content: string): Promise<Comment> {
    const route = this.routes.find(r => r.id === routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      userId,
      username,
      content,
      timestamp: new Date(),
      likes: 0
    };

    route.comments.push(comment);
    this.saveCommunityData();
    return comment;
  }

  async createChallenge(challenge: Omit<Challenge, 'id' | 'participants' | 'leaderboard'>): Promise<Challenge> {
    const newChallenge: Challenge = {
      ...challenge,
      id: `challenge_${Date.now()}`,
      participants: [],
      leaderboard: []
    };

    this.challenges.push(newChallenge);
    this.saveCommunityData();
    return newChallenge;
  }

  async joinChallenge(challengeId: string, userId: string, username: string): Promise<void> {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (!challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
      challenge.leaderboard.push({
        userId,
        username,
        progress: 0,
        rank: challenge.leaderboard.length + 1
      });
      this.saveCommunityData();
    }
  }

  async updateChallengeProgress(challengeId: string, userId: string, progress: number): Promise<void> {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const entry = challenge.leaderboard.find(e => e.userId === userId);
    if (entry) {
      entry.progress = progress;
      // Update rankings
      challenge.leaderboard.sort((a, b) => b.progress - a.progress);
      challenge.leaderboard.forEach((e, index) => {
        e.rank = index + 1;
      });
      this.saveCommunityData();
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const communityService = CommunityService.getInstance();
