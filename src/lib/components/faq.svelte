<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { fly } from "svelte/transition";

  const faqs = [
    {
      question: "¿Qué es Stickerts?",
      answer:
        "Stickerts te ayuda a completar tu álbum conectándote con otros coleccionistas para comprar, vender e intercambiar cromos.",
    },
    {
      question: "¿Cómo me contacto con un vendedor?",
      answer:
        "Haz clic en el botón del cromo que te interesa. Te redirigiremos con un mensaje pre-escrito a WhatsApp o al correo del vendedor. Desde ahí coordinan el precio, el método de pago y la entrega directamente.",
    },
    {
      question: "¿Qué es el Pase de Coleccionista?",
      answer:
        "Es un acceso único de $1.99 USD que desbloquea tu perfil de vendedor durante todo el 2026. Con él puedes publicar tus cromos, contactar vendedores y recibir mensajes directos de compradores.",
    },
    {
      question: "¿Puedo usar Stickerts sin el Pase?",
      answer:
        "Sí. Todos los usuarios registrados tienen 1 contacto gratuito para probar la plataforma. Si quieres publicar tus propios cromos o contactar a más vendedores, necesitarás el Pase de Coleccionista.",
    },
    {
      question: "¿Cómo publico mis cromos?",
      answer:
        'Necesitas el Pase de Coleccionista. Una vez activado, toca el botón "+" en la esquina inferior derecha. Sube una foto, describe el cromo, elige si lo vendes, intercambias o ambas cosas, y ya está visible para otros coleccionistas.',
    },
    {
      question: "¿Cómo funciona el intercambio?",
      answer:
        'Al publicar un cromo puedes marcarlo como "Intercambio". El comprador te contacta y le puedes ofrecer tus repetidos a cambio del cromo que él tiene. Todo se coordina directamente entre ustedes por WhatsApp, correo o el medio que acuerden.',
    },
  ];

  let openIndex = $state<number | null>(null);

  function toggle(i: number) {
    openIndex = openIndex === i ? null : i;
  }
</script>

<section class="space-y-6">
  <h2
    class="text-xl font-semibold"
    style="text-wrap: balance"
    transition:fly={{ y: 8, duration: 300, delay: 200 }}
  >
    Preguntas frecuentes
  </h2>

  <div
    class="w-full divide-y divide-border overflow-hidden rounded-4xl ring-1 ring-foreground/5"
    transition:fly={{ y: 16, duration: 400, delay: 100 }}
  >
    {#each faqs as faq, i (i)}
      <div>
        <button
          class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium transition-[background-color,transform] duration-150 hover:bg-muted/50 active:bg-muted/70"
          onclick={() => toggle(i)}
          aria-expanded={openIndex === i}
        >
          <span class="text-base font-medium">{faq.question}</span>
          <ChevronDown
            class="size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] {openIndex ===
            i
              ? 'rotate-180'
              : ''}"
          />
        </button>

        <div
          class="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style:grid-template-rows={openIndex === i ? "1fr" : "0fr"}
        >
          <div class="overflow-hidden">
            <p
              class="px-5 pt-1 pb-4 text-base leading-relaxed text-foreground/75"
              style="text-wrap: pretty"
            >
              {faq.answer}
            </p>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>
