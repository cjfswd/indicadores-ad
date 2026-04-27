import type { FC, PropsWithChildren } from 'hono/jsx'
import { Sidebar } from '../components/Sidebar.js'

interface MainLayoutProps {
  title: string
  currentPath: string
}

export const MainLayout: FC<PropsWithChildren<MainLayoutProps>> = ({ title, currentPath, children }) => (
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title} — Indicadores AD</title>
      <link rel="stylesheet" href="/css/styles.css" />
      <script src="/js/htmx.min.js"></script>
    </head>
    <body
      hx-on__htmx__after-swap="if(event.detail.target.id==='modal-container'&&event.detail.target.innerHTML.trim())document.body.classList.add('modal-open')"
      hx-on__htmx__response-error="showToast('Erro: '+event.detail.xhr.status)"
      hx-on__showToast="showToast(event.detail.message)"
    >
      <Sidebar currentPath={currentPath} />
      <main class="flex-1 ml-[260px] p-8 max-w-[1400px] flex flex-col gap-6 main-responsive">
        {children}
      </main>
      <div id="modal-container"></div>
      <div id="toast-container" class="fixed top-4 right-4 z-[200] flex flex-col gap-2"></div>
      <script dangerouslySetInnerHTML={{ __html: `
        function showToast(msg){
          var c=document.getElementById('toast-container');
          var t=document.createElement('div');t.className='py-3 px-5 rounded-lg text-sm font-medium animate-[slide-in-right_.3s_ease] shadow-[0_4px_12px_rgba(0,0,0,.3)] bg-emerald-500/90 text-white';t.textContent=msg;
          c.appendChild(t);setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove()},300)},3000);
        }
        function closeModal(){document.getElementById('modal-container').innerHTML='';document.body.classList.remove('modal-open')}
        function toggleSidebar(){document.querySelector('.sidebar-mobile-hidden').classList.toggle('open')}
        function toggleTheme(){var r=document.documentElement;var c=r.classList.contains('light')?'dark':'light';if(c==='light')r.classList.add('light');else r.classList.remove('light');localStorage.setItem('theme',c)}
        (function(){var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light')})();
      ` }} />
    </body>
  </html>
)
