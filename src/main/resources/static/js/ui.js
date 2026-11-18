function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const fmt = {
    moeda(v) {
        if (v === null || v === undefined || v === '') return '—';
        return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },
    data(iso) {
        if (!iso) return '—';
        const [a, m, d] = iso.split('-');
        return `${d}/${m}/${a}`;
    },
    num(v, casas = 1, sufixo = '') {
        if (v === null || v === undefined || v === '') return '—';
        return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + sufixo;
    },
    sinal(v, casas = 1, sufixo = '') {
        if (v === null || v === undefined) return '—';
        const s = v > 0 ? '+' : '';
        return s + fmt.num(v, casas, sufixo);
    },
    forma(f) {
        return { DINHEIRO: 'Dinheiro', PIX: 'Pix', CARTAO_CREDITO: 'Cartão de crédito', CARTAO_DEBITO: 'Cartão de débito', BOLETO: 'Boleto' }[f] || '—';
    },
    iniciais(nome) {
        return (nome || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
    }
};

function hojeISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
}

function badgeSituacao(sit) {
    const mapa = {
        PAGA: ['b-verde', 'Paga'],
        PENDENTE: ['b-azul', 'Pendente'],
        ATRASADA: ['b-vermelho', 'Atrasada'],
        CANCELADA: ['b-cinza', 'Cancelada']
    };
    const [cls, txt] = mapa[sit] || ['b-cinza', sit];
    return `<span class="badge ${cls}">${txt}</span>`;
}

function badgeAtivo(ativo, txtSim = 'Ativo', txtNao = 'Inativo') {
    return ativo ? `<span class="badge b-verde">${txtSim}</span>` : `<span class="badge b-cinza">${txtNao}</span>`;
}

function toast(mensagem, tipo = 'sucesso') {
    const el = document.createElement('div');
    el.className = 'toast ' + (tipo === 'sucesso' ? '' : tipo);
    el.textContent = mensagem;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => el.remove(), tipo === 'erro' ? 6000 : 3500);
}

function erroToast(e) {
    toast(e.message || 'Ocorreu um erro.', 'erro');
}

const modal = {
    el: null,
    abrir(titulo, html, tamanho = '') {
        this.el = document.getElementById('modal');
        document.getElementById('modal-titulo').textContent = titulo;
        const corpo = document.getElementById('modal-corpo');
        corpo.innerHTML = html;
        this.el.querySelector('.modal').className = 'modal ' + tamanho;
        this.el.hidden = false;
        const primeiro = corpo.querySelector('input:not([type=hidden]):not([readonly]), select, textarea');
        if (primeiro) setTimeout(() => primeiro.focus(), 50);
        return corpo;
    },
    fechar() {
        const el = document.getElementById('modal');
        el.hidden = true;
        document.getElementById('modal-corpo').innerHTML = '';
        if (this._resolver) { this._resolver(false); this._resolver = null; }
    }
};

document.addEventListener('click', e => {
    if (e.target.matches('[data-fechar]') || e.target.id === 'modal') modal.fechar();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.getElementById('modal').hidden) modal.fechar();
});

function confirmar(mensagem, { titulo = 'Confirmar', botao = 'Confirmar', perigo = false } = {}) {
    return new Promise(resolve => {
        const corpo = modal.abrir(titulo, `
            <p style="margin:0 0 4px">${mensagem}</p>
            <div class="form-rodape">
                <button class="btn" data-fechar>Cancelar</button>
                <button class="btn ${perigo ? 'btn-perigo-cheio' : 'btn-primario'}" id="btn-confirmar">${esc(botao)}</button>
            </div>`, 'sm');
        modal._resolver = resolve;
        corpo.querySelector('#btn-confirmar').addEventListener('click', () => {
            modal._resolver = null;
            modal.fechar();
            resolve(true);
        });
    });
}

function lerFormulario(form) {
    const obj = {};
    form.querySelectorAll('[name]').forEach(el => {
        if (el.closest('[data-ignorar]')) return;
        const nome = el.name;
        let v;
        if (el.type === 'checkbox') v = el.checked;
        else if (el.type === 'number' || el.dataset.tipo === 'numero') v = el.value === '' ? null : Number(el.value.replace(',', '.'));
        else v = el.value.trim() === '' ? null : el.value.trim();
        obj[nome] = v;
    });
    return obj;
}

function limparErros(form) {
    form.querySelectorAll('.invalido').forEach(el => el.classList.remove('invalido'));
    form.querySelectorAll('.erro-campo').forEach(el => el.remove());
}

function mostrarErros(form, erro) {
    limparErros(form);
    if (erro.campos) {
        Object.entries(erro.campos).forEach(([campo, msg]) => {
            const el = form.querySelector(`[name="${campo}"]`);
            if (el) {
                el.classList.add('invalido');
                const span = document.createElement('span');
                span.className = 'erro-campo';
                span.textContent = msg;
                el.insertAdjacentElement('afterend', span);
            }
        });
    }
    erroToast(erro);
}

async function enviarFormulario(form, acao, mensagemSucesso) {
    const botao = form.querySelector('[type=submit]');
    botao.disabled = true;
    try {
        const r = await acao(lerFormulario(form));
        modal.fechar();
        if (mensagemSucesso) toast(mensagemSucesso);
        return r;
    } catch (e) {
        mostrarErros(form, e);
        return undefined;
    } finally {
        botao.disabled = false;
    }
}

function mascaraCpf(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function mascaraTelefone(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function aplicarMascaras(raiz) {
    raiz.querySelectorAll('[data-mascara=cpf]').forEach(el => el.addEventListener('input', () => el.value = mascaraCpf(el.value)));
    raiz.querySelectorAll('[data-mascara=tel]').forEach(el => el.addEventListener('input', () => el.value = mascaraTelefone(el.value)));
}

function opcoes(lista, valorSel, rotulo = x => x.nome, vazio = null) {
    let html = vazio !== null ? `<option value="">${esc(vazio)}</option>` : '';
    html += lista.map(x => `<option value="${x.id}" ${String(x.id) === String(valorSel ?? '') ? 'selected' : ''}>${esc(rotulo(x))}</option>`).join('');
    return html;
}

function tabelaVazia(colunas, texto) {
    return `<tr><td colspan="${colunas}" class="vazio">${esc(texto)}</td></tr>`;
}

function cabecalho(titulo, subtitulo = '', botoesHtml = '') {
    document.getElementById('titulo-pagina').textContent = titulo;
    document.getElementById('subtitulo-pagina').textContent = subtitulo;
    document.getElementById('topo-acoes').innerHTML = botoesHtml;
}

function debounce(fn, ms = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function graficoLinha(pontos, { cor = '#f97316', sufixo = '' } = {}) {
    const validos = pontos.filter(p => p.valor !== null && p.valor !== undefined);
    if (validos.length === 0) return '<div class="vazio">Sem dados.</div>';
    const L = 460, A = 210, mE = 44, mD = 20, mT = 30, mB = 30;
    const vals = validos.map(p => p.valor);
    let min = Math.min(...vals), max = Math.max(...vals);
    const folga = (max - min) * 0.15 || Math.max(1, Math.abs(max) * 0.05);
    min -= folga; max += folga;
    const x = i => validos.length === 1 ? (mE + (L - mE - mD) / 2) : mE + i * (L - mE - mD) / (validos.length - 1);
    const y = v => mT + (max - v) * (A - mT - mB) / (max - min);

    let grade = '';
    for (let k = 0; k <= 3; k++) {
        const v = min + (max - min) * k / 3;
        const yy = y(v);
        grade += `<line x1="${mE}" x2="${L - mD}" y1="${yy}" y2="${yy}" stroke="#eceef2"/>` +
            `<text x="${mE - 8}" y="${yy + 4}" font-size="11" text-anchor="end" fill="#8a90a0">${fmt.num(v, 1)}</text>`;
    }
    const caminho = validos.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.valor)}`).join(' ');
    const area = `${caminho} L${x(validos.length - 1)},${A - mB} L${x(0)},${A - mB} Z`;
    const marcas = validos.map((p, i) => `
        <circle cx="${x(i)}" cy="${y(p.valor)}" r="4.5" fill="#fff" stroke="${cor}" stroke-width="2.5"><title>${esc(p.rotulo)}: ${fmt.num(p.valor, 1, sufixo)}</title></circle>
        <text x="${x(i)}" y="${y(p.valor) - 10}" font-size="11" text-anchor="middle" fill="#1f2430" font-weight="600">${fmt.num(p.valor, 1)}</text>
        <text x="${x(i)}" y="${A - 10}" font-size="11" text-anchor="middle" fill="#8a90a0">${esc(p.rotulo)}</text>`).join('');
    return `<svg viewBox="0 0 ${L} ${A}" role="img">
        ${grade}
        <path d="${area}" fill="${cor}" opacity=".08"/>
        <path d="${caminho}" fill="none" stroke="${cor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${marcas}
    </svg>`;
}
