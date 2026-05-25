<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";

  const sections = [
    {
      number: 1,
      title: "Acceptance of Terms",
      body: "By accessing or using Stickerts, you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use of the service immediately.",
    },
    {
      number: 2,
      title: "Use of Service",
      body: "You may use Stickerts only for lawful purposes and in accordance with these Terms. You agree not to use the platform in any way that violates applicable local, national, or international laws.",
    },
    {
      number: 3,
      title: "User Accounts",
      body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.",
    },
    {
      number: 4,
      title: "Purchases and Payments",
      body: "All purchases made through Stickerts are final unless otherwise stated. Prices are displayed at checkout and include any applicable fees or taxes.",
    },
    {
      number: 5,
      title: "Intellectual Property",
      body: "All content on Stickerts, including logos, designs, and text, is the property of Stickerts or its licensors. Unauthorized reproduction or distribution is strictly prohibited.",
    },
    {
      number: 6,
      title: "Privacy",
      body: "Your use of Stickerts is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review it to understand our data practices.",
    },
    {
      number: 7,
      title: "Limitation of Liability",
      body: "Stickerts shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount paid by you in the last 30 days.",
    },
    {
      number: 8,
      title: "Contact",
      body: "If you have any questions about these Terms, please contact us at support@stickerts.com. We aim to respond to all inquiries within 2 business days.",
    },
  ];
</script>

<main class="container pt-28 md:pt-36 pb-16">
  <div class="max-w-3xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8 space-y-3">
      <Badge variant="outline">Last updated: May 2026</Badge>
      <h1 class="text-3xl md:text-4xl font-bold">Terms and Conditions</h1>
      <p class="text-sm text-muted-foreground">
        Please read these terms carefully before using Stickerts. They govern
        your access to and use of our platform and services.
      </p>
      <Separator class="mt-6" />
    </div>

    <!-- Content Card -->
    <div class="rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 p-8 md:p-10">
      {#each sections as section (section.number)}
        <div class="space-y-2">
          <h2 class="text-base font-semibold">
            {section.number}. {section.title}
          </h2>
          <p class="text-sm text-muted-foreground leading-relaxed">
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
