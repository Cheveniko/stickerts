import { browser } from "$app/environment";
import type { Attachment } from "svelte/attachments";

const PAYPAL_SDK_SCRIPT_ID = "paypal-sdk";
const PAYPAL_SDK_CURRENCY = "USD";

export type CollectorPassState =
  | { kind: "idle" }
  | { kind: "initializing_paypal" }
  | { kind: "ready" }
  | { kind: "creating_order" }
  | { kind: "capturing_order" }
  | { kind: "error"; source: "sdk" | "checkout"; message: string }
  | { kind: "success" };

export type PayPalCreateOrderData = {
  orderID?: string;
};

export type PayPalOnApproveData = {
  orderID: string;
};

export type PayPalButtonActions = {
  restart: () => void;
};

export type PayPalButtonsInstance = {
  render: (container: string | HTMLElement) => Promise<void>;
  close: () => Promise<void>;
};

export type PayPalButtonsConfig = {
  createOrder: (data: PayPalCreateOrderData) => Promise<string> | string;
  onApprove: (
    data: PayPalOnApproveData,
    actions: PayPalButtonActions,
  ) => Promise<void> | void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
};

export type PayPalNamespace = {
  Buttons: (config: PayPalButtonsConfig) => PayPalButtonsInstance;
};

export type PayPalButtonsAttachmentOptions = PayPalButtonsConfig & {
  clientId: string;
  onLoading?: () => void;
  onReady?: () => void;
};

let paypalSdkPromise: Promise<PayPalNamespace> | null = null;

function getPaypalSdkUrl(clientId: string) {
  const params = new URLSearchParams({
    "client-id": clientId,
    components: "buttons",
    currency: PAYPAL_SDK_CURRENCY,
    intent: "capture",
  });

  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

export function resetPayPalSdkPromise() {
  paypalSdkPromise = null;
}

export function loadPayPalSdk(clientId: string): Promise<PayPalNamespace> {
  if (!browser) {
    return Promise.reject(
      new Error("PayPal solo se puede cargar desde el navegador."),
    );
  }

  const trimmedClientId = clientId.trim();

  if (!trimmedClientId) {
    return Promise.reject(
      new Error("Falta configurar PUBLIC_PAYPAL_CLIENT_ID."),
    );
  }

  if (window.paypal) {
    return Promise.resolve(window.paypal);
  }

  if (paypalSdkPromise) {
    return paypalSdkPromise;
  }

  paypalSdkPromise = new Promise<PayPalNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(
      PAYPAL_SDK_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    const appendScript = () => {
      const script = document.createElement("script");
      script.id = PAYPAL_SDK_SCRIPT_ID;
      script.dataset.status = "loading";
      script.dataset.clientId = trimmedClientId;
      script.src = getPaypalSdkUrl(trimmedClientId);
      script.async = true;
      script.addEventListener("load", handleResolve, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.append(script);
    };

    const handleResolve = () => {
      if (window.paypal) {
        const script = document.getElementById(
          PAYPAL_SDK_SCRIPT_ID,
        ) as HTMLScriptElement | null;
        if (script) {
          script.dataset.status = "loaded";
        }
        resolve(window.paypal);
        return;
      }

      resetPayPalSdkPromise();
      reject(new Error("PayPal no se cargo correctamente."));
    };

    const handleError = () => {
      const script = document.getElementById(
        PAYPAL_SDK_SCRIPT_ID,
      ) as HTMLScriptElement | null;
      if (script) {
        script.dataset.status = "error";
        script.remove();
      }
      resetPayPalSdkPromise();
      reject(new Error("No pudimos cargar PayPal. Intenta de nuevo."));
    };

    if (existingScript) {
      if (existingScript.dataset.clientId !== trimmedClientId) {
        existingScript.remove();
        appendScript();
        return;
      }

      if (existingScript.dataset.status === "error") {
        existingScript.remove();
        appendScript();
        return;
      }

      if (existingScript.dataset.status === "loaded") {
        handleResolve();
        return;
      }

      existingScript.addEventListener("load", handleResolve, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    appendScript();
  });

  return paypalSdkPromise;
}

export function paypalButtonsAttachment({
  clientId,
  createOrder,
  onApprove,
  onCancel,
  onError,
  onLoading,
  onReady,
}: PayPalButtonsAttachmentOptions): Attachment<HTMLDivElement> {
  return (container) => {
    let cancelled = false;
    let buttons: PayPalButtonsInstance | null = null;

    onLoading?.();

    void (async () => {
      try {
        const paypal = await loadPayPalSdk(clientId);

        if (cancelled) {
          return;
        }

        buttons = paypal.Buttons({
          createOrder,
          onApprove,
          onCancel,
          onError,
        });

        await buttons.render(container);

        if (cancelled) {
          void buttons.close().catch(() => {});
          return;
        }

        onReady?.();
      } catch (error) {
        if (!cancelled) {
          onError?.(error);
        }
      }
    })();

    return () => {
      cancelled = true;
      const currentButtons = buttons;
      buttons = null;

      if (currentButtons) {
        void currentButtons.close().catch(() => {});
      }
    };
  };
}
