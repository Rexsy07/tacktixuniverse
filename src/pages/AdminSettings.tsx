import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Percent, Clock, Shield, Bell, Palette, Save, Upload } from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [platformFee, setPlatformFee] = useState("5");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoPayouts, setAutoPayouts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSaveAllChanges = () => {
    toast.success("All settings saved successfully");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Platform Settings</h1>
              <p className="text-muted-foreground">Configure platform parameters and policies</p>
            </div>
            <Button onClick={handleSaveAllChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fees">Fees & Payouts</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    General Settings
                  </CardTitle>
                  <CardDescription>Basic platform configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="platform-name">Platform Name</Label>
                      <Input id="platform-name" defaultValue="TacktixEdge" />
                    </div>
                    <div>
                      <Label htmlFor="platform-url">Platform URL</Label>
                      <Input id="platform-url" defaultValue="tacktixedge.com" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="platform-description">Platform Description</Label>
                    <Textarea 
                      id="platform-description" 
                      defaultValue="Nigeria's premier mobile gaming competition platform"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Temporarily disable platform access for maintenance</p>
                    </div>
                    <Switch 
                      checked={maintenanceMode} 
                      onCheckedChange={setMaintenanceMode}
                    />
                  </div>

                  <div>
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" defaultValue="support@tacktixedge.com" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Percent className="h-5 w-5 mr-2" />
                    Fees & Commissions
                  </CardTitle>
                  <CardDescription>Configure platform fees and payout settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                      <Input 
                        id="platform-fee" 
                        type="number"
                        value={platformFee}
                        onChange={(e) => setPlatformFee(e.target.value)}
                        min="0"
                        max="20"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Commission taken from each match</p>
                    </div>
                    <div>
                      <Label htmlFor="tournament-fee">Tournament Fee (%)</Label>
                      <Input id="tournament-fee" type="number" defaultValue="10" min="0" max="30" />
                      <p className="text-sm text-muted-foreground mt-1">Commission from tournament entry fees</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="min-bet">Minimum Bet Amount (₦)</Label>
                      <Input id="min-bet" type="number" defaultValue="500" />
                    </div>
                    <div>
                      <Label htmlFor="max-bet">Maximum Bet Amount (₦)</Label>
                      <Input id="max-bet" type="number" defaultValue="50000" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Automatic Payouts</Label>
                      <p className="text-sm text-muted-foreground">Automatically process winnings after match completion</p>
                    </div>
                    <Switch 
                      checked={autoPayouts} 
                      onCheckedChange={setAutoPayouts}
                    />
                  </div>

                  <div>
                    <Label htmlFor="payout-delay">Payout Delay (minutes)</Label>
                    <Select defaultValue="5">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Instant</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Platform security and verification requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Require Email Verification</Label>
                        <p className="text-sm text-muted-foreground">Users must verify email before playing</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Require Phone Verification</Label>
                        <p className="text-sm text-muted-foreground">Users must verify phone for withdrawals</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                      <Input id="max-login-attempts" type="number" defaultValue="5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Configure how and when notifications are sent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send notifications via email</p>
                      </div>
                      <Switch 
                        checked={emailNotifications} 
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base font-medium">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notification-sender">Notification Sender Name</Label>
                    <Input id="notification-sender" defaultValue="TacktixEdge" />
                  </div>

                  <div>
                    <Label htmlFor="notification-email">Notification Email Address</Label>
                    <Input id="notification-email" defaultValue="notifications@tacktixedge.com" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Appearance Settings
                  </CardTitle>
                  <CardDescription>Customize the platform's look and feel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="primary-color">Primary Brand Color</Label>
                    <div className="flex items-center space-x-4">
                      <Input id="primary-color" defaultValue="#8B5CF6" type="color" className="w-20 h-10" />
                      <Input defaultValue="#8B5CF6" className="flex-1" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="logo-upload">Platform Logo</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <p className="text-muted-foreground">Drag & drop logo here or click to browse</p>
                      <Button variant="outline" className="mt-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="favicon-upload">Favicon</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <p className="text-muted-foreground">Upload favicon (16x16 or 32x32 pixels)</p>
                      <Button variant="outline" className="mt-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Favicon
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Dark Mode by Default</Label>
                      <p className="text-sm text-muted-foreground">Set dark mode as the default theme</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;