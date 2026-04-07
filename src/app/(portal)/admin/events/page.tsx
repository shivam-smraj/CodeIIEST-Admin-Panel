"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Calendar, Tag, X, UserPlus } from "lucide-react";

interface AvatarEntry { name: string; img: string }

interface Event {
  _id: string;
  title: string;
  miniTitle: string;
  description: string;
  completionStatus: number;
  TagsList?: string[];
  imageVariant?: string;
  moreInfo?: string;
  sideDetails1?: { text1?: string; text2?: string; text3?: string };
  sideDetails2?: { text1?: string; text2?: string; text3?: string };
  AvatarSampleData?: AvatarEntry[];
  createdAt: string;
}

const EMPTY_FORM: Omit<Event, "_id" | "createdAt"> = {
  title: "", miniTitle: "", description: "", completionStatus: 0,
  TagsList: [], imageVariant: "", moreInfo: "#",
  sideDetails1: { text1: "", text2: "", text3: "" },
  sideDetails2: { text1: "", text2: "", text3: "" },
  AvatarSampleData: [],
};

export default function AdminEventsPage() {
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState("");
  const [open, setOpen]       = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState({ ...EMPTY_FORM });
  const [tagInput, setTagInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [avatarInput, setAvatarInput] = useState<AvatarEntry>({ name: "", img: "" });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) setEvents(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setTagInput("");
    setAvatarInput({ name: "", img: "" });
    setOpen(true);
  }

  function openEdit(ev: Event) {
    setEditId(ev._id);
    setForm({
      title: ev.title, miniTitle: ev.miniTitle, description: ev.description,
      completionStatus: ev.completionStatus, TagsList: ev.TagsList ?? [],
      imageVariant: ev.imageVariant ?? "", moreInfo: ev.moreInfo ?? "#",
      sideDetails1: ev.sideDetails1 ?? { text1: "", text2: "", text3: "" },
      sideDetails2: ev.sideDetails2 ?? { text1: "", text2: "", text3: "" },
      AvatarSampleData: ev.AvatarSampleData ?? [],
    });
    setTagInput("");
    setAvatarInput({ name: "", img: "" });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url    = editId ? `/api/admin/events/${editId}` : "/api/admin/events";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success(editId ? "Event updated!" : "Event created!");
      setOpen(false);
      fetchEvents();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Event deleted"); fetchEvents(); }
    else { toast.error("Delete failed"); }
    setDeleteId(null);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.TagsList?.includes(t)) {
      setForm(p => ({ ...p, TagsList: [...(p.TagsList ?? []), t] }));
    }
    setTagInput("");
  }

  function addAvatar() {
    const { name, img } = avatarInput;
    if (!name.trim()) return;
    setForm(p => ({ ...p, AvatarSampleData: [...(p.AvatarSampleData ?? []), { name: name.trim(), img: img.trim() }] }));
    setAvatarInput({ name: "", img: "" });
  }

  function setSideDetail(key: "sideDetails1" | "sideDetails2", field: "text1" | "text2" | "text3", value: string) {
    setForm(p => ({ ...p, [key]: { ...(p[key] ?? {}), [field]: value } }));
  }

  const filtered = events.filter(ev =>
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    ev.miniTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-muted-foreground text-sm">{events.length} event{events.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
          <Plus className="w-4 h-4" /> Create Event
        </Button>
      </div>

      <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
        className="max-w-sm bg-background/60 border-border/60" />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{search ? "No events match your search." : "No events yet. Create the first one!"}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(ev => (
            <Card key={ev._id} className="border-border/50 bg-card/60 hover:border-indigo-500/30 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white truncate">{ev.title}</h3>
                      <span className="text-xs text-muted-foreground">{ev.miniTitle}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {(ev.TagsList ?? []).slice(0, 4).map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5">
                          <Tag className="w-2.5 h-2.5 mr-1" />{t}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${ev.completionStatus >= 100 ? "bg-green-400" : ev.completionStatus > 0 ? "bg-orange-400" : "bg-muted-foreground"}`} />
                        {ev.completionStatus}% complete
                      </span>
                      {ev.sideDetails1?.text2 && (
                        <span className="text-xs text-muted-foreground">📅 {ev.sideDetails1.text2}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEdit(ev)} className="border-border/60 h-8 w-8 p-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(ev._id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>Fill in the event details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Title */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                  className="bg-background/60 border-border/60" placeholder="Fresher's Contest 2.0" />
              </div>
              {/* Mini Title */}
              <div className="space-y-1.5">
                <Label htmlFor="miniTitle">Mini Title *</Label>
                <Input id="miniTitle" value={form.miniTitle} onChange={e => setForm(p => ({ ...p, miniTitle: e.target.value }))} required
                  className="bg-background/60 border-border/60" placeholder="Competitive Programming Event" />
              </div>
              {/* Completion */}
              <div className="space-y-1.5">
                <Label htmlFor="completionStatus">Completion % (0–100)</Label>
                <Input id="completionStatus" type="number" min={0} max={100}
                  value={form.completionStatus} onChange={e => setForm(p => ({ ...p, completionStatus: parseInt(e.target.value) || 0 }))}
                  className="bg-background/60 border-border/60" />
              </div>
              {/* Description */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="description">Description *</Label>
                <textarea id="description" required rows={3}
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md text-sm bg-background/60 border border-border/60 focus:border-indigo-500 outline-none resize-none text-white placeholder:text-muted-foreground"
                  placeholder="Event description..." />
              </div>
              {/* Image Variant */}
              <div className="space-y-1.5">
                <Label htmlFor="imageVariant">Image Variant</Label>
                <Input id="imageVariant" value={form.imageVariant ?? ""} onChange={e => setForm(p => ({ ...p, imageVariant: e.target.value }))}
                  className="bg-background/60 border-border/60" placeholder="cpdsa / development / aiml" />
              </div>
              {/* More Info */}
              <div className="space-y-1.5">
                <Label htmlFor="moreInfo">More Info URL</Label>
                <Input id="moreInfo" value={form.moreInfo ?? ""} onChange={e => setForm(p => ({ ...p, moreInfo: e.target.value }))}
                  className="bg-background/60 border-border/60" placeholder="https://..." />
              </div>
            </div>

            {/* Side Details 1 */}
            <div className="space-y-2 border border-border/40 rounded-md p-3">
              <Label className="text-indigo-400 font-semibold text-xs uppercase tracking-wide">Side Detail 1 (e.g. Date / Starts)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Label (text1)</Label>
                  <Input value={form.sideDetails1?.text1 ?? ""} onChange={e => setSideDetail("sideDetails1","text1",e.target.value)}
                    className="bg-background/60 border-border/60 text-sm" placeholder="Starts" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Date (text2)</Label>
                  <Input value={form.sideDetails1?.text2 ?? ""} onChange={e => setSideDetail("sideDetails1","text2",e.target.value)}
                    className="bg-background/60 border-border/60 text-sm" placeholder="10th Feb, 2025" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Time (text3)</Label>
                  <Input value={form.sideDetails1?.text3 ?? ""} onChange={e => setSideDetail("sideDetails1","text3",e.target.value)}
                    className="bg-background/60 border-border/60 text-sm" placeholder="5:00 PM" />
                </div>
              </div>
            </div>

            {/* Side Details 2 */}
            <div className="space-y-2 border border-border/40 rounded-md p-3">
              <Label className="text-indigo-400 font-semibold text-xs uppercase tracking-wide">Side Detail 2 (e.g. Venue)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Label (text1)</Label>
                  <Input value={form.sideDetails2?.text1 ?? ""} onChange={e => setSideDetail("sideDetails2","text1",e.target.value)}
                    className="bg-background/60 border-border/60 text-sm" placeholder="venue" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Value (text2)</Label>
                  <Input value={form.sideDetails2?.text2 ?? ""} onChange={e => setSideDetail("sideDetails2","text2",e.target.value)}
                    className="bg-background/60 border-border/60 text-sm" placeholder="CSD205 / Online" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Extra (text3)</Label>
                  <Input value={form.sideDetails2?.text3 ?? ""} onChange={e => setSideDetail("sideDetails2","text3",e.target.value)}
                    className="bg-background/60 border-border/60 text-sm" placeholder="OFFLINE (optional)" />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className="bg-background/60 border-border/60 flex-1" placeholder="CP, DSA, AI (Enter to add)" />
                <Button type="button" variant="outline" size="sm" onClick={addTag} className="border-border/60">Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(form.TagsList ?? []).map(t => (
                  <Badge key={t} variant="secondary" className="gap-1 text-xs">
                    {t}
                    <button type="button" onClick={() => setForm(p => ({ ...p, TagsList: p.TagsList?.filter(x => x !== t) }))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Avatar Sample Data */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Organizer Avatars (AvatarSampleData)</Label>
              <div className="flex gap-2">
                <Input value={avatarInput.name} onChange={e => setAvatarInput(p => ({ ...p, name: e.target.value }))}
                  className="bg-background/60 border-border/60 flex-1" placeholder="Full Name" />
                <Input value={avatarInput.img} onChange={e => setAvatarInput(p => ({ ...p, img: e.target.value }))}
                  className="bg-background/60 border-border/60 flex-1" placeholder="photo.webp (filename)" />
                <Button type="button" variant="outline" size="sm" onClick={addAvatar} className="border-border/60 shrink-0">Add</Button>
              </div>
              {(form.AvatarSampleData ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(form.AvatarSampleData ?? []).map((a, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs">
                      {a.name}
                      <button type="button" onClick={() => setForm(p => ({ ...p, AvatarSampleData: p.AvatarSampleData?.filter((_, j) => j !== i) }))}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border/60">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? "Save Changes" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="border-border/60">Cancel</Button>
            <Button onClick={() => handleDelete(deleteId!)} className="bg-red-600 hover:bg-red-500 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
