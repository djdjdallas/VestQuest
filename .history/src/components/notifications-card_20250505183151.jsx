import { Calendar, Clock, DollarSign, Bell } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

export function NotificationsCard({ notifications = [] }) {
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "vesting":
        return Clock;
      case "exercise":
        return Calendar;
      case "tax":
        return DollarSign;
      default:
        return Bell;
    }
  };

  // Format the due date
  const formatDueDate = (dueDate) => {
    if (!dueDate) return "Important";

    try {
      // Parse the date if it's a string
      const date = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;

      if (!isValid(date)) return "Important";

      // Calculate if the date is upcoming (within 30 days)
      const now = new Date();
      const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24));

      if (diff < 0) {
        return "Overdue";
      } else if (diff === 0) {
        return "Today";
      } else if (diff === 1) {
        return "Tomorrow";
      } else if (diff < 7) {
        return `In ${diff} days`;
      } else if (diff < 30) {
        return `In ${Math.floor(diff / 7)} weeks`;
      } else {
        return format(date, "MMM d, yyyy");
      }
    } catch (error) {
      return "Important";
    }
  };

  // If no notifications, show placeholder
  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-muted-foreground text-center">
          No notifications at this time. We'll notify you about upcoming vesting
          events and important dates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const NotificationIcon = getNotificationIcon(
          notification.notification_type
        );
        return (
          <div key={notification.id} className="flex items-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <NotificationIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-sm text-muted-foreground">
                {notification.description}
              </p>
              <p className="mt-1 text-xs font-medium text-primary">
                {formatDueDate(notification.due_date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
