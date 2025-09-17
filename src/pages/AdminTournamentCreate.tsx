import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const AdminTournamentCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    name: "",
    game_id: "",
    format: "",
    entry_fee: 0,
    prize_pool: 0,
    max_participants: 0,
    start_date: "",
    is_featured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: form.name,
          game_id: form.game_id,
          format: form.format,
          entry_fee: Number(form.entry_fee) || 0,
          prize_pool: Number(form.prize_pool) || 0,
          max_participants: Number(form.max_participants) || 0,
          start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
          status: 'registration',
          is_featured: !!form.is_featured,
        })
        .select('id')
        .single();
      if (error) throw error;
      toast.success('Tournament created');
      navigate(`/admin/tournaments/${data.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>
          <Card className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((p: any) => ({...p, name: e.target.value}))} required />
              </div>
              <div>
                <Label htmlFor="game_id">Game ID</Label>
                <Input id="game_id" value={form.game_id} onChange={(e) => setForm((p: any) => ({...p, game_id: e.target.value}))} required />
              </div>
              <div>
                <Label htmlFor="format">Format</Label>
                <Input id="format" value={form.format} onChange={(e) => setForm((p: any) => ({...p, format: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry_fee">Entry Fee (₦)</Label>
                  <Input id="entry_fee" type="number" value={form.entry_fee} onChange={(e) => setForm((p: any) => ({...p, entry_fee: e.target.value}))} />
                </div>
                <div>
                  <Label htmlFor="prize_pool">Prize Pool (₦)</Label>
                  <Input id="prize_pool" type="number" value={form.prize_pool} onChange={(e) => setForm((p: any) => ({...p, prize_pool: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input id="max_participants" type="number" value={form.max_participants} onChange={(e) => setForm((p: any) => ({...p, max_participants: e.target.value}))} />
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" type="datetime-local" value={form.start_date} onChange={(e) => setForm((p: any) => ({...p, start_date: e.target.value}))} />
                </div>
              </div>
              <div>
                <Label htmlFor="is_featured">Featured</Label>
                <Select value={form.is_featured ? 'yes' : 'no'} onValueChange={(v) => setForm((p: any) => ({...p, is_featured: v === 'yes'}))}>
                  <SelectTrigger id="is_featured">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Tournament'}</Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminTournamentCreate;




