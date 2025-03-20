import React from 'react';
import { useAchievements } from '@/services/achievements-service';
import { analyticsService } from '@/services/analytics-service';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function AchievementsPanel() {
  const { achievements } = useAchievements();
  const stats = analyticsService.getAllStats();

  const activityTypes = Object.keys(stats);

  return (
    <Tabs defaultValue="achievements" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>

      <TabsContent value="achievements">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`
                relative overflow-hidden transition-all duration-300
                ${achievement.achieved ? 'bg-primary/10' : 'bg-muted/50'}
              `}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={(achievement.progress / achievement.requirement) * 100}
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {achievement.progress.toFixed(1)} / {achievement.requirement}{' '}
                  {achievement.type === 'distance' ? 'km' : ''}
                </p>
                {achievement.achieved && achievement.achievedDate && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Achieved {achievement.achievedDate.toLocaleDateString()}
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary">
                    {achievement.rarity}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="stats">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {activityTypes.map((activity) => {
            const activityStats = stats[activity];
            return (
              <Card key={activity}>
                <CardHeader>
                  <CardTitle className="capitalize">{activity}</CardTitle>
                  <CardDescription>Activity Statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt>Total Distance</dt>
                      <dd>{activityStats.totalDistance.toFixed(2)} km</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Total Duration</dt>
                      <dd>{(activityStats.totalDuration / 3600).toFixed(1)} hours</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Total Elevation</dt>
                      <dd>{activityStats.totalElevation.toFixed(0)} m</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Routes Completed</dt>
                      <dd>{activityStats.routesCompleted}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Current Streak</dt>
                      <dd>{activityStats.streakDays} days</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            );
          })}

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Report</CardTitle>
              <CardDescription>Your activity summary for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const report = analyticsService.generateWeeklyReport();
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{report.totalActivities}</p>
                        <p className="text-sm text-muted-foreground">Activities</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {report.totalDistance.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">Kilometers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {(report.totalDuration / 3600).toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">Hours</p>
                      </div>
                    </div>
                    <Progress
                      value={report.weeklyGoalProgress}
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      {report.weeklyGoalProgress}% of weekly goal completed
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
