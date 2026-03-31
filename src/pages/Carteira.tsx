import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Check, Plus, Users, Crown, UserMinus, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Carteira() {
  const { user } = useAuth();
  const { households, activeHousehold, members, isOwner, activeHouseholdId, setActiveHouseholdId } = useHousehold();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [removeMember, setRemoveMember] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["households"] });
    queryClient.invalidateQueries({ queryKey: ["household-members"] });
  };

  const createHousehold = async () => {
    if (!newName.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase.from("households").insert({ name: newName.trim(), owner_user_id: user.id }).select().single();
    if (error) { toast.error("Erro ao criar carteira"); setSaving(false); return; }
    await supabase.from("household_members").insert({ household_id: data.id, user_id: user.id, role: "owner", status: "active" });
    toast.success("Carteira criada!");
    setShowCreate(false);
    setNewName("");
    setSaving(false);
    invalidate();
    setActiveHouseholdId(data.id);
  };

  const joinHousehold = async () => {
    if (!joinCode.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("join_household_by_code", { _invite_code: joinCode.trim() });
    if (error || !(data as any)?.success) {
      toast.error((data as any)?.error || "Código inválido");
      setSaving(false);
      return;
    }
    toast.success(`Entrou na carteira "${(data as any).household_name}"!`);
    setShowJoin(false);
    setJoinCode("");
    setSaving(false);
    invalidate();
  };

  const copyInviteCode = () => {
    if (!activeHousehold?.invite_code) return;
    const url = `${window.location.origin}/carteira?convite=${activeHousehold.invite_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link de convite copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmRemoveMember = async () => {
    if (!removeMember) return;
    const { error } = await supabase.from("household_members").delete().eq("id", removeMember.id);
    if (error) { toast.error("Erro ao remover membro"); return; }
    toast.success("Membro removido.");
    setRemoveMember(null);
    invalidate();
  };

  // Auto-join via URL
  const params = new URLSearchParams(window.location.search);
  const conviteParam = params.get("convite");

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Carteiras</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie suas carteiras compartilhadas</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
              <LinkIcon className="w-4 h-4" /> Entrar
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Nova Carteira
            </button>
          </div>
        </div>

        {/* Household selector */}
        {households.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {households.map((h) => (
              <button
                key={h.id}
                onClick={() => setActiveHouseholdId(h.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  h.id === activeHouseholdId
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>
        )}

        {/* Active household details */}
        {activeHousehold && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground">{activeHousehold.name}</h2>
                  <p className="text-xs text-muted-foreground">{members.length} membro{members.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {isOwner && (
                <button onClick={copyInviteCode} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado" : "Link de convite"}
                </button>
              )}
            </div>

            {/* Members list */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Membros</p>
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {m.role === "owner" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                    <span className="text-sm text-foreground">
                      {m.user_id === user?.id ? "Você" : m.user_id.slice(0, 8) + "…"}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{m.role === "owner" ? "Dono" : "Membro"}</span>
                  </div>
                  {isOwner && m.user_id !== user?.id && (
                    <button onClick={() => setRemoveMember(m)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {conviteParam && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-3">
            <p className="text-sm text-foreground">Você recebeu um convite para entrar em uma carteira compartilhada.</p>
            <button
              onClick={() => { setJoinCode(conviteParam); joinHousehold(); }}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Aceitar Convite
            </button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Nova Carteira</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Família, Casal…"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={createHousehold} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Criando…" : "Criar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Entrar em uma Carteira</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Código de convite</label>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Cole o link ou código aqui"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowJoin(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={joinHousehold} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Entrando…" : "Entrar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove member confirmation */}
      <AlertDialog open={!!removeMember} onOpenChange={() => setRemoveMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>Este membro perderá acesso à carteira compartilhada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
