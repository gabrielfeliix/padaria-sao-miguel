(() => {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');

  const WHATSAPP = '5584994815161';
  const ANO_FUNDACAO = 1967;
  const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const tocar = (video) => { const p = video.play(); if (p) p.catch(() => {}); };

  /* ---------- Hero: lema palavra por palavra e vídeo ---------- */
  document.querySelectorAll('[data-palavras]').forEach((el) => {
    const texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    el.textContent = '';
    texto.split(/\s+/).forEach((palavra, i) => {
      const fora = document.createElement('span');
      fora.className = 'palavra';
      fora.setAttribute('aria-hidden', 'true');
      const dentro = document.createElement('span');
      dentro.style.setProperty('--i', i);
      dentro.textContent = palavra;
      fora.appendChild(dentro);
      el.append(fora, ' ');
    });
  });

  const hero = document.querySelector('.hero');
  const heroVideo = document.querySelector('.hero__video');
  const botaoPausa = document.querySelector('.hero__pausa');
  const rotuloPausa = (tocando) => {
    botaoPausa.textContent = tocando ? 'Pausar vídeo' : 'Reproduzir vídeo';
    botaoPausa.setAttribute('aria-pressed', String(!tocando));
  };
  if (menosMovimento) rotuloPausa(false);
  else heroVideo.play().catch(() => rotuloPausa(false)); // sem autoplay, o pôster fica no lugar
  botaoPausa.addEventListener('click', () => {
    if (heroVideo.paused) heroVideo.play().then(() => rotuloPausa(true)).catch(() => {});
    else { heroVideo.pause(); rotuloPausa(false); }
  });
  requestAnimationFrame(() => requestAnimationFrame(() => doc.classList.add('pronto')));

  // Fora da tela, o vídeo da hero e os letreiros param para não gastar processamento
  let heroPausadoPelaPessoa = false;
  botaoPausa.addEventListener('click', () => { heroPausadoPelaPessoa = heroVideo.paused; });
  new IntersectionObserver((entradas) => {
    if (menosMovimento || heroPausadoPelaPessoa) return;
    if (entradas[0].isIntersecting) tocar(heroVideo); else heroVideo.pause();
  }).observe(hero);
  const vigiaLetreiro = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => e.target.classList.toggle('is-parado', !e.isIntersecting));
  });
  document.querySelectorAll('.letreiro').forEach((l) => vigiaLetreiro.observe(l));

  /* ---------- Topo ---------- */
  const topo = document.getElementById('topo');
  const botaoMenu = topo.querySelector('.topo__menu');
  const fecharMenu = () => {
    topo.classList.remove('is-aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.querySelector('.sr-only').textContent = 'Abrir menu';
  };
  botaoMenu.addEventListener('click', () => {
    const aberto = topo.classList.toggle('is-aberto');
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.querySelector('.sr-only').textContent = aberto ? 'Fechar menu' : 'Abrir menu';
  });
  topo.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', fecharMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });
  // Com o foco dentro do topo ele nunca fica escondido
  topo.addEventListener('focusin', () => topo.classList.remove('is-escondido'));

  /* ---------- Rolagem: topo, barra de leitura, hero e paralaxe ---------- */
  const heroCentro = document.querySelector('.hero__centro');
  // Paralaxe só em tela grande: no celular custa mais do que aparece
  const comParalaxe = (menosMovimento || !temMouse) ? [] : Array.from(document.querySelectorAll('[data-paralaxe]'));
  let ultimoY = window.scrollY;
  let quadro = 0;

  function aoRolar() {
    if (quadro) return;
    quadro = requestAnimationFrame(() => {
      quadro = 0;
      const y = window.scrollY;
      const alturaTela = window.innerHeight;

      topo.classList.toggle('is-solido', y > alturaTela * 0.35);
      if (Math.abs(y - ultimoY) > 6) {
        topo.classList.toggle('is-escondido', y > ultimoY && y > alturaTela * 0.8);
        ultimoY = y;
      }
      topo.style.setProperty('--lido', Math.min(1, y / Math.max(1, doc.scrollHeight - alturaTela)).toFixed(4));

      if (!menosMovimento && y < alturaTela * 1.1) {
        const rola = Math.min(1, y / alturaTela);
        heroCentro.style.transform = `translate3d(0, ${(rola * -80).toFixed(1)}px, 0)`;
        heroCentro.style.opacity = Math.max(0, 1 - rola * 1.4).toFixed(3);
      }

      comParalaxe.forEach((el) => {
        const caixa = el.parentElement.getBoundingClientRect();
        if (caixa.bottom < -200 || caixa.top > alturaTela + 200) return;
        const desvio = (caixa.top + caixa.height / 2 - alturaTela / 2) * Number(el.dataset.paralaxe);
        el.style.translate = `0 ${desvio.toFixed(1)}px`;
      });
    });
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', aoRolar);
  aoRolar();

  /* ---------- Entradas ao aparecer na tela ---------- */
  const contar = (el) => {
    const ate = Number(el.dataset.conta);
    const de = Number(el.dataset.de || 0);
    if (menosMovimento) { el.textContent = ate; return; }
    const inicio = performance.now();
    const DURACAO = 1800;
    const passo = (agora) => {
      const t = Math.min(1, (agora - inicio) / DURACAO);
      const suave = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(de + (ate - de) * suave);
      if (t < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };

  // O tempo de casa é calculado, para o número não envelhecer
  const anosForno = document.getElementById('anos-forno');
  anosForno.dataset.conta = new Date().getFullYear() - ANO_FUNDACAO;
  anosForno.textContent = anosForno.dataset.conta;

  // Os títulos sobem por trás de uma máscara: o texto vai para um span interno
  document.querySelectorAll('[data-revela="titulo"]').forEach((titulo) => {
    const dentro = document.createElement('span');
    dentro.className = 'titulo__dentro';
    dentro.append(...titulo.childNodes);
    titulo.appendChild(dentro);
  });

  // Irmãos que entram juntos ganham um pequeno atraso em escada
  document.querySelectorAll('[data-revela]').forEach((el) => {
    if (el.style.getPropertyValue('--atraso')) return;
    const irmaos = Array.from(el.parentElement.children).filter((i) => i.hasAttribute('data-revela'));
    el.style.setProperty('--atraso', `${irmaos.indexOf(el) * 0.09}s`);
  });
  document.querySelectorAll('.loja__faixa .cartao').forEach((c, i) => c.style.setProperty('--i', i));

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      observador.unobserve(e.target);
      e.target.classList.add('is-visto');
      if (e.target.dataset.conta) contar(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-revela], [data-conta], .loja__faixa').forEach((el) => observador.observe(el));

  /* ---------- Letreiros: o conteúdo é duplicado para emendar o laço ---------- */
  document.querySelectorAll('[data-letreiro]').forEach((trilho) => {
    const original = trilho.innerHTML;
    // repete até passar de duas telas, sempre em número par de cópias
    let copias = 2;
    trilho.innerHTML = original + original;
    while (trilho.scrollWidth < window.innerWidth * 2.2 && copias < 16) { trilho.innerHTML += original + original; copias += 2; }
  });

  /* ---------- Do café ao jantar: momentos e janela ---------- */
  const mesa = document.getElementById('mesa');
  const pratos = Array.from(mesa.querySelectorAll('.prato'));
  const midias = Array.from(mesa.querySelectorAll('.mesa__midia'));
  const janela = document.getElementById('mesa-janela');
  const TEMPO_PRATO = 6000;
  let pratoAtual = 0;
  let relogioPrato = 0;
  let mesaNaTela = false;
  let mesaSolta = !menosMovimento; // roda sozinha até a pessoa escolher

  function mostrarPrato(indice) {
    if (indice === pratoAtual) return;
    const sai = midias[pratoAtual];
    const entra = midias[indice];
    pratos.forEach((p, i) => {
      p.classList.toggle('is-ativo', i === indice);
      p.querySelector('button').setAttribute('aria-expanded', String(i === indice));
    });
    midias.forEach((m) => m.classList.remove('is-saindo'));
    sai.classList.remove('is-ativa');
    sai.classList.add('is-saindo');
    entra.classList.add('is-ativa');
    if (entra.tagName === 'VIDEO' && !menosMovimento) { entra.currentTime = 0; tocar(entra); }
    setTimeout(() => { sai.classList.remove('is-saindo'); if (sai.tagName === 'VIDEO') sai.pause(); }, 950);
    pratoAtual = indice;
  }

  function agendarPrato() {
    clearTimeout(relogioPrato);
    mesa.classList.toggle('is-rodando', mesaSolta && mesaNaTela);
    if (!mesaSolta || !mesaNaTela) return;
    relogioPrato = setTimeout(() => { mostrarPrato((pratoAtual + 1) % pratos.length); agendarPrato(); }, TEMPO_PRATO);
  }

  pratos.forEach((prato, i) => {
    const botao = prato.querySelector('button');
    const escolher = () => { mesaSolta = false; agendarPrato(); mostrarPrato(i); };
    botao.addEventListener('click', escolher);
    if (temMouse) botao.addEventListener('mouseenter', escolher);
  });

  new IntersectionObserver((entradas) => {
    mesaNaTela = entradas[0].isIntersecting;
    const atual = midias[pratoAtual];
    if (atual.tagName === 'VIDEO') { if (mesaNaTela && !menosMovimento) tocar(atual); else atual.pause(); }
    agendarPrato();
  }, { threshold: 0.25 }).observe(mesa);

  // No celular, deslizar o dedo sobre a janela troca o momento
  let toque = null;
  janela.addEventListener('touchstart', (e) => { toque = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  janela.addEventListener('touchend', (e) => {
    if (!toque) return;
    const dx = e.changedTouches[0].clientX - toque.x;
    const dy = e.changedTouches[0].clientY - toque.y;
    toque = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    mesaSolta = false;
    agendarPrato();
    mostrarPrato((pratoAtual + (dx < 0 ? 1 : pratos.length - 1)) % pratos.length);
  }, { passive: true });

  /* ---------- A loja: faixa que arrasta, setas e o vídeo curto ---------- */
  const faixa = document.getElementById('loja-faixa');
  const voltar = document.getElementById('loja-voltar');
  const avancar = document.getElementById('loja-avancar');
  const passoFaixa = () => faixa.querySelector('.cartao').offsetWidth * 1.6;
  const atualizarSetas = () => {
    voltar.disabled = faixa.scrollLeft < 8;
    avancar.disabled = faixa.scrollLeft > faixa.scrollWidth - faixa.clientWidth - 8;
  };
  voltar.addEventListener('click', () => faixa.scrollBy({ left: -passoFaixa(), behavior: menosMovimento ? 'auto' : 'smooth' }));
  avancar.addEventListener('click', () => faixa.scrollBy({ left: passoFaixa(), behavior: menosMovimento ? 'auto' : 'smooth' }));
  faixa.addEventListener('scroll', atualizarSetas, { passive: true });
  atualizarSetas();

  let arrasto = null;
  faixa.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return; // no toque a rolagem nativa já resolve
    arrasto = { x: e.clientX, inicio: faixa.scrollLeft, andou: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!arrasto) return;
    const dx = e.clientX - arrasto.x;
    if (!arrasto.andou && Math.abs(dx) > 5) { arrasto.andou = true; faixa.classList.add('is-arrastando'); }
    if (arrasto.andou) faixa.scrollLeft = arrasto.inicio - dx;
  });
  window.addEventListener('pointerup', () => { arrasto = null; faixa.classList.remove('is-arrastando'); });

  const lojaVideo = document.getElementById('loja-video');
  new IntersectionObserver((entradas) => {
    if (entradas[0].isIntersecting && !menosMovimento) tocar(lojaVideo); else lojaVideo.pause();
  }, { threshold: 0.5 }).observe(lojaVideo);

  /* ---------- Encomenda pelo WhatsApp ---------- */
  const form = document.getElementById('form-pedido');
  const validar = (campo, erroId) => {
    const vazio = !campo.value.trim();
    campo.setAttribute('aria-invalid', String(vazio));
    if (vazio) campo.setAttribute('aria-describedby', erroId); else campo.removeAttribute('aria-describedby');
    document.getElementById(erroId).hidden = !vazio;
    return !vazio;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const okNome = validar(form.nome, 'erro-nome');
    const okItens = validar(form.itens, 'erro-itens');
    if (!okNome || !okItens) {
      (okNome ? form.itens : form.nome).focus();
      return;
    }
    const linhas = [
      `Olá! Aqui é ${form.nome.value.trim()}. Quero fazer uma encomenda:`,
      form.itens.value.trim(),
      `Retirada: ${form.unidade.value}`,
    ];
    if (form.quando.value.trim()) linhas.push(`Para quando: ${form.quando.value.trim()}`);
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
  });
  ['nome', 'itens'].forEach((n) => form[n].addEventListener('input', () => {
    if (form[n].getAttribute('aria-invalid') === 'true') validar(form[n], `erro-${n}`);
  }));

  /* ---------- Unidades: o mapa troca com a unidade escolhida ---------- */
  const mapa = document.getElementById('mapa-quadro');
  const caixaMapa = document.getElementById('mapa');
  const unidades = Array.from(document.querySelectorAll('.unidade'));
  mapa.addEventListener('load', () => caixaMapa.classList.remove('is-trocando'));
  // O mapa do Google é pesado: só carrega quando a seção está chegando
  const vigiaMapa = new IntersectionObserver((entradas) => {
    if (!entradas[0].isIntersecting) return;
    vigiaMapa.disconnect();
    if (!mapa.src) mapa.src = mapa.dataset.src;
  }, { rootMargin: '600px 0px' });
  vigiaMapa.observe(caixaMapa);
  unidades.forEach((botao) => botao.addEventListener('click', () => {
    if (botao.classList.contains('is-ativa')) return;
    unidades.forEach((u) => {
      u.classList.toggle('is-ativa', u === botao);
      u.setAttribute('aria-pressed', String(u === botao));
    });
    caixaMapa.classList.add('is-trocando');
    mapa.src = botao.dataset.mapa;
    mapa.title = botao.dataset.titulo;
  }));
})();
