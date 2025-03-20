import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'distance' | 'streak' | 'routes' | 'elevation' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  achieved: boolean;
  achievedDate?: Date;
}

interface AchievementsState {
  achievements: Achievement[];
  unlockedAchievements: string[];
  updateProgress: (type: Achievement['type'], value: number) => void;
  checkAchievements: () => void;
}

const ACHIEVEMENTS: Omit<Achievement, 'progress' | 'achieved' | 'achievedDate'>[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first mindful route',
    icon: '🌱',
    requirement: 1,
    type: 'routes',
    rarity: 'common'
  },
  {
    id: 'weekly_warrior',
    title: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    requirement: 7,
    type: 'streak',
    rarity: 'rare'
  },
  {
    id: 'mountain_climber',
    title: 'Mountain Climber',
    description: 'Accumulate 1000m of elevation gain',
    icon: '⛰️',
    requirement: 1000,
    type: 'elevation',
    rarity: 'epic'
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Share 10 routes with the community',
    icon: '🦋',
    requirement: 10,
    type: 'social',
    rarity: 'rare'
  },
  {
    id: 'marathon_master',
    title: 'Marathon Master',
    description: 'Complete 42.2km in total distance',
    icon: '🏃',
    requirement: 42.2,
    type: 'distance',
    rarity: 'epic'
  },
  {
    id: 'century_rider',
    title: 'Century Rider',
    description: 'Complete 100km in total distance',
    icon: '🚴',
    requirement: 100,
    type: 'distance',
    rarity: 'legendary'
  }
];

export const useAchievements = create<AchievementsState>()(
  persist(
    (set, get) => ({
      achievements: ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        progress: 0,
        achieved: false
      })),
      unlockedAchievements: [],

      updateProgress: (type, value) => {
        set(state => ({
          achievements: state.achievements.map(achievement => {
            if (achievement.type === type) {
              const newProgress = achievement.progress + value;
              return {
                ...achievement,
                progress: newProgress
              };
            }
            return achievement;
          })
        }));
        get().checkAchievements();
      },

      checkAchievements: () => {
        set(state => {
          const newUnlocked: string[] = [];
          const updatedAchievements = state.achievements.map(achievement => {
            if (!achievement.achieved && achievement.progress >= achievement.requirement) {
              newUnlocked.push(achievement.id);
              return {
                ...achievement,
                achieved: true,
                achievedDate: new Date()
              };
            }
            return achievement;
          });

          if (newUnlocked.length > 0) {
            // Show achievement notifications
            newUnlocked.forEach(id => {
              const achievement = updatedAchievements.find(a => a.id === id);
              if (achievement) {
                showAchievementNotification(achievement);
              }
            });
          }

          return {
            achievements: updatedAchievements,
            unlockedAchievements: [...state.unlockedAchievements, ...newUnlocked]
          };
        });
      }
    }),
    {
      name: 'achievements-storage'
    }
  )
);

function showAchievementNotification(achievement: Achievement) {
  // You can implement your preferred notification system here
  const notification = new Notification('Achievement Unlocked! 🎉', {
    body: `${achievement.title} - ${achievement.description}`,
    icon: '/achievements/${achievement.id}.png'
  });
}
