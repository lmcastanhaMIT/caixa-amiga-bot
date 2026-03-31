import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function WhatsAppPanel() {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchConnection();
  }, [user]);

  async function fetchConnection() {
    setLoading(true);
    const { data } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("user_id", user!.id)
      .eq("is_active", true)
      .maybeSingle();
    setConnection(data);
    setLoading(false);
  }

  function formatPhoneE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    return `+${digits}`;
  }

  async function handleConnect() {
    if (!phone.trim()) {
      toast.error("Informe o número com DDI");
      return;
    }
    const phoneE164 = formatPhoneE164(phone);
    if (phoneE164.length < 12) {
      toast.error("Número inválido. Use o formato: +5511999998888");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("whatsapp_connections").insert({
      user_id: user!.id,
      phone_e164: phoneE164,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Este número já está vinculado a uma conta.");
      } else {
        toast.error(`Erro ao vincular: ${error.message}`);
      }
    } else {
      toast.success("Número vinculado com sucesso!");
      setPhone("");
      fetchConnection();
    }
    setSaving(false);
  }

  async function handleDisconnect() {
    if (!connection) return;
    setSaving(true);
    const { error } = await supabase
      .from("whatsapp_connections")
      .update({ is_active: false })
      .eq("id", connection.id);

    if (error) {
      toast.error(`Erro: ${error.message}`);
    } else {
      toast.success("Número desvinculado.");
      setConnection(null);
    }
    setSaving(false);
  }

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">WhatsApp</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte seu WhatsApp para gerenciar finanças por mensagem
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Conexão WhatsApp</CardTitle>
                <CardDescription>
                  Vincule seu número para usar o FinAssist via WhatsApp
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </div>
            ) : connection ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-foreground">{connection.phone_e164}</p>
                      <p className="text-xs text-muted-foreground">
                        Conectado em {new Date(connection.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                    Ativo
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={saving}
                  className="text-destructive hover:text-destructive"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Desvincular número
                </Button>

                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">💡 Como usar</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Envie "gastei 50 no mercado" para registrar despesas</li>
                    <li>• Envie "recebi 5000 salário" para registrar receitas</li>
                    <li>• Envie "meu saldo" para consultar seu saldo</li>
                    <li>• Envie "resumo do mês" para o resumo mensal</li>
                    <li>• Envie "fechamento" para o relatório completo</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Nenhum número conectado</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Número com DDI</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      placeholder="+5511999998888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleConnect} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Conectar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Informe o número no formato internacional: +55 + DDD + número
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default WhatsAppPanel;
