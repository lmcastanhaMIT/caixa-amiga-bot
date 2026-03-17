import AppLayout from "@/components/AppLayout";
import ChatSimulator from "@/components/ChatSimulator";

export default function Chat() {
  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Chat Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">Simulação do assistente WhatsApp — teste as interações</p>
        </div>
        <ChatSimulator />
      </div>
    </AppLayout>
  );
}
