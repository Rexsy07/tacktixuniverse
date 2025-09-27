import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, AlertCircle, CheckCircle, Clock, Calendar, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notificationText, setNotificationText] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [targetQuery, setTargetQuery] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationText || !selectedAudience) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSending(true);
      if (selectedAudience === 'all') {
        const { error } = await supabase.from('notifications').insert({
          title: notificationTitle,
          message: notificationText,
          audience: 'all',
          target_user_id: null,
        });
        if (error) throw error;
        toast.success("Sent to all users");
      } else if (selectedAudience === 'user') {
        if (!targetQuery.trim()) {
          toast.error("Enter a username or user ID");
          return;
        }
        // Try to resolve username to user_id, or accept direct user_id
        let targetUserId = targetQuery.trim();
        if (!/^([0-9a-f\-]{36})$/i.test(targetUserId)) {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('user_id, username')
            .ilike('username', targetUserId)
            .limit(1)
            .single();
          if (profErr || !prof) {
            toast.error("User not found by username");
            return;
          }
          targetUserId = prof.user_id;
        }
        const { error } = await supabase.from('notifications').insert({
          title: notificationTitle,
          message: notificationText,
          audience: 'user',
          target_user_id: targetUserId,
        });
        if (error) throw error;
        toast.success("Sent to user");
      } else {
        toast.error("Unsupported audience");
        return;
      }

      setNotificationTitle("");
      setNotificationText("");
      setSelectedAudience("");
      setTargetQuery("");
    } catch (e: any) {
      toast.error(e.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleScheduleNotification = () => {
    if (!notificationTitle || !notificationText || !selectedAudience) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Notification scheduled successfully");
  };

  const handleSaveDraft = () => {
    toast.success("Notification saved as draft");
  };

  const notifications = [
    {
      id: "N001",
      title: "Tournament Registration Open",
      message: "New CODM Championship registration is now open!",
      audience: "All Users",
      status: "sent",
      sentAt: "2024-01-15 10:30",
      opened: 234,
      clicked: 67
    },
    {
      id: "N002",
      title: "Maintenance Notice",
      message: "Platform will undergo maintenance tomorrow 2-4 AM",
      audience: "All Users", 
      status: "scheduled",
      scheduledFor: "2024-01-16 01:00"
    },
    {
      id: "N003",
      title: "Wallet Verification Required",
      message: "Please verify your wallet for withdrawals",
      audience: "Unverified Users",
      status: "draft"
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "sent": return "bg-green-500";
      case "scheduled": return "bg-blue-500"; 
      case "draft": return "bg-gray-500";
      default: return "bg-yellow-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "sent": return <CheckCircle className="h-4 w-4" />;
      case "scheduled": return <Clock className="h-4 w-4" />;
      case "draft": return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Notification Center</h1>
              <p className="text-muted-foreground">Send announcements and updates to users</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Notification */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Send Notification
                </CardTitle>
                <CardDescription>Create and send notifications to users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Notification title..."
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your notification message..."
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Audience</Label>
                  <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="user">Individual User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedAudience === 'user' && (
                  <div>
                    <Label htmlFor="target">Target User (username or user ID)</Label>
                    <Input
                      id="target"
                      placeholder="e.g. johndoe or 550e8400-e29b-41d4-a716-446655440000"
                      value={targetQuery}
                      onChange={(e) => setTargetQuery(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button className="flex-1" onClick={handleSendNotification} disabled={sending}>
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : 'Send Now'}
                  </Button>
                  <Button variant="outline" onClick={handleScheduleNotification}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>

                <Button variant="ghost" className="w-full" onClick={handleSaveDraft}>
                  Save as Draft
                </Button>
              </CardContent>
            </Card>

            {/* Notification History */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification History
                </CardTitle>
                <CardDescription>Recent notifications and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="capitalize flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(notification.status)}`}></div>
                              {getStatusIcon(notification.status)}
                              <span>{notification.status}</span>
                            </Badge>
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {notification.audience}
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium mb-1">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          
                          <div className="text-xs text-muted-foreground">
                            {notification.status === "sent" && (
                              <div>
                                Sent: {notification.sentAt} • 
                                Opened: {notification.opened} • 
                                Clicked: {notification.clicked}
                              </div>
                            )}
                            {notification.status === "scheduled" && (
                              <div>Scheduled for: {notification.scheduledFor}</div>
                            )}
                            {notification.status === "draft" && (
                              <div>Draft - Not sent</div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          {notification.status === "draft" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/admin/notifications/edit/${notification.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {notification.status === "scheduled" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/admin/notifications/edit/${notification.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Modify
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => navigate(`/admin/notifications/${notification.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.5%</div>
                <p className="text-xs text-muted-foreground">Average this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28.7%</div>
                <p className="text-xs text-muted-foreground">Average this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Pending notifications</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;