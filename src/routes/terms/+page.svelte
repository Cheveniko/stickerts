<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import { Separator } from "$lib/components/ui/separator";

  const sections = [
    {
      number: 1,
      title: m.terms_section_1_title(),
      body: m.terms_section_1_body(),
    },
    {
      number: 2,
      title: m.terms_section_2_title(),
      body: m.terms_section_2_body(),
    },
    {
      number: 3,
      title: m.terms_section_3_title(),
      body: m.terms_section_3_body(),
    },
    {
      number: 4,
      title: m.terms_section_4_title(),
      body: m.terms_section_4_body(),
    },
    {
      number: 5,
      title: m.terms_section_5_title(),
      body: m.terms_section_5_body(),
    },
    {
      number: 6,
      title: m.terms_section_6_title(),
      body: m.terms_section_6_body(),
    },
    {
      number: 7,
      title: m.terms_section_7_title(),
      body: m.terms_section_7_body(),
    },
    {
      number: 8,
      title: m.terms_section_8_title(),
      body: m.terms_section_8_body(),
    },
  ];
</script>

<main class="container pt-20 pb-16 md:pt-36">
  <div class="mx-auto max-w-3xl">
    <div class="mb-8 space-y-3">
      <!-- <Badge variant="outline">Última actualización: mayo 2026</Badge> -->
      <h1 class="text-3xl font-bold md:text-4xl">{m.terms_title()}</h1>
      <p class="text-sm text-balance text-muted-foreground">
        {m.terms_intro()}
      </p>
      <Separator class="mt-6" />
    </div>

    <div
      class="rounded-4xl bg-card p-8 shadow-md ring-1 ring-foreground/5 md:p-10"
    >
      {#each sections as section (section.number)}
        <div class="space-y-2">
          <h2 class="text-base font-semibold">
            {section.number}. {section.title}
          </h2>
          <p class="text-sm leading-relaxed text-muted-foreground">
            {section.body}
          </p>
        </div>
        {#if section.number < sections.length}
          <Separator class="my-6" />
        {/if}
      {/each}
    </div>
  </div>
</main>
