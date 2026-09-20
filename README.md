# Velosity — Real-Time Client Project Dashboard

A full-stack project management dashboard built for the Velozity Global Solutions Full Stack Developer Technical Assessment.

The application allows Admins, Project Managers, and Developers to manage projects and tasks with strict role-based access control, real-time activity updates, notifications, and automated overdue-task processing.

---

## Live Demo

**Frontend:** `ADD_YOUR_VERCEL_URL_HERE`

**Repository:** `ADD_YOUR_GITHUB_REPOSITORY_URL_HERE`

---

## Features

### Authentication & Authorization

- JWT-based authentication
- Access token + refresh token flow
- Refresh token stored in an HttpOnly cookie
- API-level role-based authorization
- Protected routes on both frontend and backend
- Role-specific dashboards and permissions
- Developers cannot access another developer's tasks
- Project Managers can only manage projects they created
- Admin has global access

### Roles

#### Admin

- View all projects
- View all tasks
- Create and manage clients
- Create and manage users
- View global activity feed
- View project details
- View active users
- View notifications
- Monitor overall project progress

#### Project Manager

- Create and manage their own projects
- Assign developers to tasks
- View their team
- Monitor team workload
- View activity from their own projects
- Receive notifications when tasks move to In Review
- Monitor task priorities and due dates

#### Developer

- View assigned tasks only
- Update assigned task status
- View task activity
- Receive task assignment notifications
- Cannot access other developers' tasks

---

# Real-Time Activity Feed

Real-time updates are implemented using **Socket.IO**.

When a task status changes:

1. The change is saved to PostgreSQL.
2. An ActivityLog record is created.
3. The activity is emitted through Socket.IO.
4. Connected users receive the update without refreshing the page.
5. The activity is filtered according to the user's role and project/task access.

### Activity visibility

| Role | Activity Access |
|------|-----------------|
| Admin | All projects |
| Project Manager | Their own projects |
| Developer | Tasks assigned to them |

When a user reconnects after being offline, the application retrieves the latest activity history from PostgreSQL rather than relying on an in-memory cache.

---

# Notifications

The application provides database-backed in-app notifications.

Notifications are generated when:

- A task is assigned to a Developer
- A task owned by a Project Manager moves to `IN_REVIEW`

Users can:

- View unread notification count
- Open notification dropdown
- Mark individual notifications as read
- Mark all notifications as read

Unread notification counts are updated in real time using Socket.IO instead of polling.

---

# Dashboard

## Admin Dashboard

Displays:

- Total projects
- Total tasks
- Overdue tasks
- Active users currently online
- Project overview
- Recent tasks
- Global activity feed

## Project Manager Dashboard

Displays:

- Own projects
- Project task summaries
- Team members
- Developer workload
- Task priorities
- Upcoming due dates
- Project activity

## Developer Dashboard

Displays:

- Assigned tasks
- Task priority
- Task status
- Due dates
- Task activity
- Notifications

Developer tasks are ordered by priority and due date.

---

# Task Management

Each task contains:

- Title
- Description
- Assigned Developer
- Status
- Priority
- Due date
- Project
- Activity history

### Task Statuses

- `TODO`
- `IN_PROGRESS`
- `IN_REVIEW`
- `DONE`
- `OVERDUE`

### Priorities

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Task status changes are stored in the database together with the user and timestamp responsible for the change.

---

# Filtering

Task lists support filtering by:

- Status
- Priority
- Due date range

Filters are passed through query parameters so filtered URLs can be shared and revisited.

Example:

```text
/api/tasks?status=IN_PROGRESS&priority=HIGH
```
