<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { fly } from "svelte/transition";
  import * as m from "$lib/paraglide/messages";

  const faqs = [
    {
      question: m.faq_q1(),
      answer: m.faq_a1(),
    },
    {
      question: m.faq_q2(),
      answer: m.faq_a2(),
    },
    {
      question: m.faq_q3(),
      answer: m.faq_a3(),
    },
    {
      question: m.faq_q4(),
      answer: m.faq_a4(),
    },
    {
      question: m.faq_q5(),
      answer: m.faq_a5(),
    },
    {
      question: m.faq_q6(),
      answer: m.faq_a6(),
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
    {m.faq_title()}
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
