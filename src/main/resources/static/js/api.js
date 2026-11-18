const API_BASE = (location.protocol === 'file:' || ['5500', '5501', '3000', '5173', '8000'].includes(location.port))
    ? 'http://localhost:8080/api'
    : '/api';

class ErroApi extends Error {
    constructor(mensagem, status, campos) {
        super(mensagem);
        this.status = status;
        this.campos = campos || null;
    }
}

const api = {
    async requisicao(metodo, caminho, corpo) {
        const opcoes = { method: metodo, headers: {} };
        if (corpo !== undefined) {
            opcoes.headers['Content-Type'] = 'application/json';
            opcoes.body = JSON.stringify(corpo);
        }
        let resp;
        try {
            resp = await fetch(API_BASE + caminho, opcoes);
        } catch (e) {
            throw new ErroApi('Não foi possível conectar ao servidor. O back-end está rodando?', 0);
        }
        if (resp.status === 204) return null;

        const texto = await resp.text();
        const dados = texto ? JSON.parse(texto) : null;
        if (!resp.ok) {
            throw new ErroApi((dados && dados.mensagem) || `Erro ${resp.status}`, resp.status, dados && dados.campos);
        }
        return dados;
    },
    get(caminho) { return this.requisicao('GET', caminho); },
    post(caminho, corpo) { return this.requisicao('POST', caminho, corpo ?? {}); },
    put(caminho, corpo) { return this.requisicao('PUT', caminho, corpo); },
    patch(caminho, corpo) { return this.requisicao('PATCH', caminho, corpo); },
    del(caminho) { return this.requisicao('DELETE', caminho); }
};

function qs(params) {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') p.append(k, v);
    });
    const s = p.toString();
    return s ? '?' + s : '';
}
