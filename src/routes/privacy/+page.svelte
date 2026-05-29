<script lang="ts">
  import { Separator } from "$lib/components/ui/separator";

  const sections = [
    {
      number: 1,
      title: "Introducción",
      body: "Stickerts está comprometido con la protección de los datos personales de sus usuarios. Esta Política de Privacidad explica cómo recopilamos, utilizamos y protegemos la información tratada a través de la plataforma, en cumplimiento con la Ley Orgánica de Protección de Datos Personales de Ecuador.",
    },
    {
      number: 2,
      title: "Responsable del tratamiento de datos",
      body: "Stickerts es responsable del tratamiento de los datos personales utilizados en la plataforma. Adoptamos medidas técnicas y organizativas razonables para proteger la confidencialidad, integridad y seguridad de la información tratada en el servicio.",
    },
    {
      number: 3,
      title: "Datos personales recopilados",
      body: "El principal dato personal que recopilamos es el correo electrónico del usuario. Además, podemos tratar información operativa mínima necesaria para el funcionamiento de la plataforma, como datos de sesión, publicaciones, imágenes de cromos, mensajes enviados dentro del servicio y datos técnicos asociados a la compra del Pase de Coleccionista cuando corresponda. No recopilamos datos personales con fines ajenos al funcionamiento de Stickerts.",
    },
    {
      number: 4,
      title: "Finalidades del tratamiento de datos",
      body: "Utilizamos la información tratada en Stickerts únicamente para permitir el inicio de sesión, mantener la sesión activa, enviar enlaces de acceso, facilitar el contacto entre compradores y vendedores, operar publicaciones de cromos, procesar funcionalidades relacionadas con el Pase de Coleccionista y proteger la seguridad del servicio. Stickerts no vende datos personales ni los utiliza con fines comerciales, publicitarios o de marketing.",
    },
    {
      number: 5,
      title: "Compartición limitada de información",
      body: "Stickerts solo comparte información cuando es necesario para operar la plataforma o prestar una funcionalidad solicitada por el usuario. Esto puede incluir proveedores tecnológicos y de pago que intervienen en la autenticación, envío de correos, almacenamiento de imágenes, analítica técnica y procesamiento del Pase de Coleccionista. También puede compartirse la información necesaria entre usuarios cuando la funcionalidad de la plataforma requiera facilitar el contacto entre compradores y vendedores.",
    },
    {
      number: 6,
      title: "Derechos de los titulares de los datos",
      body: "De conformidad con la Ley Orgánica de Protección de Datos Personales de Ecuador, los usuarios pueden solicitar acceso, rectificación, actualización o eliminación de sus datos personales, cuando ello sea legal y técnicamente procedente. Para ejercer estos derechos o realizar consultas sobre el tratamiento de datos, puedes escribir a nicolas@smartpass.ec.",
    },
    {
      number: 7,
      title: "Conservación de los datos",
      body: "Los datos personales serán conservados durante el tiempo necesario para prestar el servicio, mantener la cuenta activa, atender solicitudes del usuario, resolver incidencias y cumplir con obligaciones legales o técnicas aplicables. Cuando los datos ya no sean necesarios para estos fines, podrán ser eliminados o anonimizados según corresponda.",
    },
    {
      number: 8,
      title: "Uso de cookies y sesión",
      body: "Stickerts utiliza cookies, tokens de sesión y tecnologías equivalentes para permitir la autenticación, mantener la sesión iniciada, proteger el acceso a la cuenta y asegurar el funcionamiento básico de la plataforma. Estas tecnologías no se utilizan para fines publicitarios ni para la venta de datos personales.",
    },
    {
      number: 9,
      title: "Seguridad de la información",
      body: "Stickerts adopta medidas razonables para proteger la información de accesos no autorizados, alteraciones, pérdidas o usos indebidos.",
    },
    {
      number: 10,
      title: "Modificaciones y contacto",
      body: "Stickerts podrá actualizar esta Política de Privacidad en cualquier momento para reflejar cambios legales, operativos o funcionales de la plataforma. La versión vigente estará disponible en este sitio. Para cualquier duda o consulta sobre esta política o sobre el tratamiento de datos personales, puedes contactarnos en nicolas@smartpass.ec.",
    },
  ];
</script>

<main class="container pt-20 pb-16 md:pt-36">
  <div class="mx-auto max-w-3xl">
    <div class="mb-8 space-y-3">
      <h1 class="text-3xl font-bold md:text-4xl">Política de Privacidad</h1>
      <p class="text-sm text-balance text-muted-foreground">
        Esta política explica cómo Stickerts recopila, utiliza y protege la
        información tratada a través de la plataforma.
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
