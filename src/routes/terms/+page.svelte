<script lang="ts">
  import { Separator } from "$lib/components/ui/separator";

  const sections = [
    {
      number: 1,
      title: "Aceptación de los términos",
      body: "Al acceder o usar Stickerts, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, debes dejar de utilizar la plataforma inmediatamente.",
    },
    {
      number: 2,
      title: "Descripción del servicio",
      body: "Stickerts es una plataforma que conecta a coleccionistas para publicar, buscar, comprar, vender o intercambiar cromos. Stickerts no actúa como vendedor directo, no es parte de las transacciones entre usuarios y no garantiza que una operación se complete exitosamente.",
    },
    {
      number: 3,
      title: "Elegibilidad y cuentas",
      body: "El uso de Stickerts está permitido únicamente a personas mayores de edad. Eres responsable de mantener la confidencialidad de tu cuenta, de la información que proporcionas al registrarte y de toda actividad realizada desde tu perfil.",
    },
    {
      number: 4,
      title: "Publicaciones y conducta del usuario",
      body: "Cada usuario es el único responsable por la veracidad, exactitud y legalidad de los datos, fotos, descripciones, precios y condiciones de los cromos que publique u ofrezca en Stickerts. No está permitido publicar contenido engañoso, fraudulento, ofensivo o que infrinja derechos de terceros o leyes aplicables.",
    },
    {
      number: 5,
      title: "Contactos, transacciones y seguridad",
      body: "Stickerts únicamente facilita el contacto entre usuarios. El precio, forma de pago, entrega, intercambio, estado del cromo y cualquier otra condición de la transacción son acordados directamente entre las partes, fuera de la plataforma. Recomendamos que cualquier encuentro o intercambio se realice en lugares públicos y seguros. Toda transacción realizada entre usuarios es bajo su exclusiva responsabilidad.",
    },
    {
      number: 6,
      title: "Pase de Coleccionista y pagos",
      body: "Stickerts puede ofrecer productos o accesos digitales, incluyendo el Pase de Coleccionista. Salvo que se indique expresamente lo contrario, el Pase de Coleccionista es un acceso digital no reembolsable. La compra del Pase habilita funcionalidades dentro de la plataforma, pero no garantiza ventas, intercambios, contactos exitosos ni resultados comerciales para el usuario.",
    },
    {
      number: 7,
      title: "Limitación de responsabilidad",
      body: "Stickerts no es responsable por la veracidad, autenticidad, calidad, estado, disponibilidad o legalidad de los cromos ofrecidos en la plataforma ni por el comportamiento de los usuarios. Tampoco seremos responsables por incumplimientos, fraudes, estafas, errores en publicaciones, pérdida de dinero, pérdida de objetos, daños indirectos o cualquier perjuicio derivado de contactos o transacciones entre usuarios.",
    },
    {
      number: 8,
      title: "Privacidad, modificaciones y contacto",
      body: "Tu uso de Stickerts también está sujeto a nuestra Política de Privacidad. Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento, publicando la versión actualizada en la plataforma. Si tienes preguntas sobre estos términos, puedes escribir a nicolas@smartpass.ec. Estos términos se regirán por las leyes aplicables de Ecuador.",
    },
  ];
</script>

<main class="container pt-20 pb-16 md:pt-36">
  <div class="mx-auto max-w-3xl">
    <div class="mb-8 space-y-3">
      <!-- <Badge variant="outline">Última actualización: mayo 2026</Badge> -->
      <h1 class="text-3xl font-bold md:text-4xl">Términos y Condiciones</h1>
      <p class="text-sm text-balance text-muted-foreground">
        Lee estos términos cuidadosamente antes de usar Stickerts. Regulan tu
        acceso a la plataforma y el uso de sus funcionalidades y servicios.
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
