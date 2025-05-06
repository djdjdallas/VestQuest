import { Calendar, Clock, DollarSign } from "lucide-react";

export function NotificationsCard() {
  const notifications = [
    {
      id: 1,
      title: "Vesting milestone approaching",
      description: "625 shares vesting on June 15, 2023",
      icon: Clock,
      date: "In 2 weeks",
    },
    {
      id: 2,
      title: "Exercise window reminder",
      description: "90-day window if you leave the company",
      icon: Calendar,
      date: "Important",
    },
    {
      id: 3,
      title: "Tax payment due",
      description: "Estimated tax for recent exercise",
      icon: DollarSign,
      date: "July 15, 2023",
    },
  ];

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div key={notification.id} className="flex items-start">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <notification.icon className="h-4 w-4 text-primary" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground">
              {notification.description}
            </p>
            <p className="mt-1 text-xs font-medium text-primary">
              {notification.date}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
