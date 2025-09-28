import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notificationText, setNotificationText] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [targetQuery, setTargetQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (!/^([0-9a-f\\-]{36})$/i.test(targetUserId)) {
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

      // refresh history
      await loadHistory();
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

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('id, created_at, title, message, audience, target_user_id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.error('Failed to load notifications history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const ch = supabase
      .channel('admin-notifications-history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => loadHistory())
      .subscribe();
    return () => {
      try { ch.unsubscribe?.(); supabase.removeChannel?.(ch); } catch (_) {}
    };
  }, []);

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
                <CardDescription>Recent notifications sent via the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading && (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  )}
                  {!loading && history.length === 0 && (
                    <div className="text-sm text-muted-foreground">No notifications yet</div>
                  )}
                  {!loading && history.map((n) => (
                    <div key={n.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="capitalize">
                              <Users className="h-3 w-3 mr-1" />
                              {n.audience === 'all' ? 'All Users' : 'Individual User'}
                            </Badge>
                            {n.target_user_id && (
                              <Badge variant="outline" className="font-mono text-xs">{String(n.target_user_id).slice(0,8)}…</Badge>
                            )}
                          </div>
                          <h4 className="font-medium mb-1">{n.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{n.message}</p>
                          <div className="text-xs text-muted-foreground">
                            Sent: {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/notifications/${n.id}`)}>
                            <Eye className="h-4 w-4 mr-1" />
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
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;