import AdminSidebar from "@/components/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAdvertiseSubmissions, AdvertiseSubmission } from "@/hooks/useAdvertiseSubmissions";
import { useEffect, useMemo, useState } from "react";
import { Check, DollarSign, ExternalLink, Filter, Loader2, RefreshCw, X } from "lucide-react";

const statuses: AdvertiseSubmission['status'][] = ['pending', 'approved', 'rejected', 'paid'];

const AdminAdvertise = () => {
  const { rows, loading, error, fetchAll, setStatus, updateViews } = useAdminAdvertiseSubmissions();
  const [statusFilter, setStatusFilter] = useState<AdvertiseSubmission['status'] | ''>('pending');

  useEffect(() => {
    fetchAll(statusFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const counters = useMemo(() => {
    const map: Record<string, number> = { all: rows.length };
    for (const s of statuses) map[s] = rows.filter(r => r.status === s).length;
    return map;
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-64 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Advertising Submissions</h1>
            <p className="text-foreground/70">Review user-submitted promotional videos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchAll(statusFilter || undefined)}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <Badge variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => setStatusFilter('')} className="cursor-pointer">
            All {counters.all ? `(${counters.all})` : ''}
          </Badge>
          {statuses.map(s => (
            <Badge key={s} variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)} className="cursor-pointer capitalize">
              {s} {counters[s] ? `(${counters[s]})` : ''}
            </Badge>
          ))}
        </div>

        <Card>
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-semibold">Submissions</div>
            {loading && <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…</div>}
          </div>
          <div className="p-4 overflow-x-auto">
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No submissions found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-foreground/70">{r.user_id.slice(0,8)}…</TableCell>
                      <TableCell><Badge variant="outline">{r.platform}</Badge></TableCell>
                      <TableCell className="max-w-[280px]">
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center">
                          <span className="truncate max-w-[240px]">{r.url}</span>
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            className="w-28 h-8"
                            type="number"
                            min={0}
                            defaultValue={r.views}
                            onBlur={async (e) => {
                              const v = Number(e.currentTarget.value);
                              if (!Number.isFinite(v) || v === r.views) return;
                              try { await updateViews(r.id, v); } catch {}
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'approved' ? 'secondary' : r.status === 'rejected' ? 'destructive' : r.status === 'paid' ? 'outline' : 'default'} className="capitalize">
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {r.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'approved')}>
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setStatus(r.id, 'rejected')}>
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {r.status === 'approved' && (
                            <Button size="sm" onClick={() => setStatus(r.id, 'paid')}>
                              <DollarSign className="h-4 w-4 mr-1" /> Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAdvertise;