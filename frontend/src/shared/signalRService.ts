import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";

class SignalRService {
  private connection: HubConnection | null = null;

  connect(getToken: () => string) {
    if (this.connection?.state === HubConnectionState.Connected) return;

    this.connection = new HubConnectionBuilder()
      .withUrl("/hubs/billullo", { accessTokenFactory: getToken })
      .withAutomaticReconnect()
      .build();

    this.connection.start().catch((err) =>
      console.error("SignalR connection failed:", err),
    );
  }

  disconnect() {
    this.connection?.stop();
    this.connection = null;
  }

  on(event: string, handler: (...args: unknown[]) => void) {
    this.connection?.on(event, handler);
  }

  off(event: string, handler: (...args: unknown[]) => void) {
    this.connection?.off(event, handler);
  }
}

export const signalRService = new SignalRService();
