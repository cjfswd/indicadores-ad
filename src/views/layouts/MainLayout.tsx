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
      <main class="main-content">
        {children}
      </main>
      <div id="modal-container"></div>
      <div id="toast-container"></div>
      <script dangerouslySetInnerHTML={{ __html: `
        function showToast(msg){
          var c=document.getElementById('toast-container');
          var t=document.createElement('div');t.className='toast';t.textContent=msg;
          c.appendChild(t);setTimeout(function(){t.classList.add('toast-exit');setTimeout(function(){t.remove()},300)},3000);
        }
        function closeModal(){document.getElementById('modal-container').innerHTML='';document.body.classList.remove('modal-open')}
        function toggleSidebar(){document.querySelector('.sidebar').classList.toggle('sidebar-open')}
        function toggleTheme(){var r=document.documentElement;var c=r.getAttribute('data-theme')==='light'?'dark':'light';r.setAttribute('data-theme',c);localStorage.setItem('theme',c)}
        (function(){var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)})();
      ` }} />
    </body>
  </html>
)
