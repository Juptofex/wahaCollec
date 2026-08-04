<script lang="ts">
  import { page } from '$app/stores';

  const links = [
    { href: '/', label: 'Factions' },
    { href: '/collection', label: 'Collection' },
    { href: '/armies', label: 'Armée' },
  ];
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 z-50">
  {#each links as link}
    {@const active = $page.url.pathname === link.href}
    <a
      href={link.href}
      class="flex flex-col items-center justify-center text-xs gap-1 flex-1 h-full"
      class:text-blue-600={active}
      class:text-gray-400={!active}
    >
      <span class="text-xl">{link.icon}</span>
      <span>{link.label}</span>
    </a>
  {/each}
</nav>